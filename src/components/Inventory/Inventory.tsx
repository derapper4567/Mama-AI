import React, { useState, useEffect } from 'react'
import { Card } from '../UI/Card'
import { Button } from '../UI/Button'
import { Badge } from '../UI/Badge'
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  DollarSign,
  Activity
} from 'lucide-react'
import { InventoryItem } from '../../types'
import axios from 'axios'
import { Recommendationspanel } from '../Recommendationspanel'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface InventoryProps {
  onPredictions?: (predictions: any[]) => void;
  onOrders?: (orders: any[]) => void;
  onInventory?: (inventory: InventoryItem[]) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ onPredictions, onOrders, onInventory }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [predictions, setPredictions] = useState<any[]>([])
  const [optimizedOrders, setOptimizedOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // **Fixed state for single-item prediction**
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [singlePrediction, setSinglePrediction] = useState<number | null>(null)
  const [isPredictingOne, setIsPredictingOne] = useState(false)
  
  // **NEW: State for single item optimization**
  const [singleItemOrder, setSingleItemOrder] = useState<any>(null)
  const [isOptimizingOne, setIsOptimizingOne] = useState(false)

  const fetchInventory = () => {
    axios
      .get<InventoryItem[]>(`${API_BASE_URL}/inventory/`)
      .then((res) => {
        setInventory(res.data)
        if (onInventory) onInventory(res.data)
      })
      .catch((err) => {
        console.error('Error fetching inventory:', err)
        setInventory([])
      })
  }

  useEffect(() => {
    fetchInventory()
    // eslint-disable-next-line
  }, [])

  // Batch actions...
  const handleAutoFill = async () => {
    try {
      await axios.post(`${API_BASE_URL}/inventory/fill/`)
      fetchInventory()
    } catch (error) {
      console.error('Error auto-filling inventory:', error)
    }
  }

  // **Fixed: Batch prediction for all filtered items**
  const handlePredictDemand = async () => {
    setIsLoading(true)
    try {
      const filtered = inventory.filter((i) =>
        filterCategory === 'all' ? true : i.category === filterCategory
      )
      
      console.log('Sending prediction request for filtered items:', filtered)
      
      const { data } = await axios.post(`${API_BASE_URL}/predict-demand/`, {
        Item: filtered.map((i) => ({
          id: i.id,
          region: i.region,
          category: i.category,
          cost: i.cost,
          available_stock: i.available_stock
        }))
      })
      
      console.log('Prediction response:', data)
      
      setPredictions(data.predictions || [])
      if (onPredictions) onPredictions(data.predictions || [])
    } catch (error) {
      console.error('Error predicting demand:', error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }

  // **NEW: Single item prediction function**
  const handlePredictSingleItem = async () => {
    if (!selectedRegion || !selectedCategory || !selectedItem) return
    
    setIsPredictingOne(true)
    setSinglePrediction(null)
    setSingleItemOrder(null) // Reset order when new prediction is made
    
    try {
      // Find the specific item
      const selectedInventoryItem = inventory.find(
        (item) => 
          item.name === selectedItem && 
          item.region === selectedRegion && 
          item.category === selectedCategory
      )
      
      if (!selectedInventoryItem) {
        console.error('Selected item not found in inventory')
        return
      }
      
      console.log('Predicting for single item:', selectedInventoryItem)
      
      const { data } = await axios.post(`${API_BASE_URL}/predict-demand/`, {
        Item: [{
          id: selectedInventoryItem.id,
          region: selectedInventoryItem.region,
          category: selectedInventoryItem.category,
          cost: selectedInventoryItem.cost,
          available_stock: selectedInventoryItem.available_stock
        }]
      })
      
      console.log('Single prediction response:', data)
      
      let predictionValue = null;
      
      // Handle different possible response formats
      if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        if (typeof data.predictions[0] === 'number') {
          predictionValue = data.predictions[0];
        } else if (data.predictions[0].predicted_demand !== undefined) {
          predictionValue = data.predictions[0].predicted_demand;
        }
      } else if (data.predicted_demand !== undefined) {
        predictionValue = data.predicted_demand;
      } else if (typeof data === 'number') {
        predictionValue = data;
      }
      
      // Only set if we have a valid number
      if (predictionValue !== null && predictionValue !== undefined && predictionValue !== '') {
        setSinglePrediction(Number(predictionValue));
      } else {
        setSinglePrediction(null);
        console.error('Invalid or empty prediction value received:', predictionValue);
      }
    } catch (error) {
      console.error('Error predicting single item:', error)
    } finally {
      setIsPredictingOne(false)
    }
  }

  // **NEW: Single item optimization function**
  const handleOptimizeSingleItem = async () => {
    if (!selectedRegion || !selectedCategory || !selectedItem || singlePrediction === null) return
    
    setIsOptimizingOne(true)
    setSingleItemOrder(null)
    
    try {
      // Find the specific item
      const selectedInventoryItem = inventory.find(
        (item) => 
          item.name === selectedItem && 
          item.region === selectedRegion && 
          item.category === selectedCategory
      )
      
      if (!selectedInventoryItem) {
        console.error('Selected item not found in inventory')
        return
      }
      
      console.log('Optimizing order for single item:', selectedInventoryItem)
      
      const { data } = await axios.post(`${API_BASE_URL}/optimize_orders/`, {
        Item: [{
          id: selectedInventoryItem.id,
          cost: selectedInventoryItem.cost,
          available_stock: selectedInventoryItem.available_stock,
          predicted_demand: singlePrediction
        }]
      })
      
      console.log('Single optimization response:', data)
      
      // Extract order information
      if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        setSingleItemOrder(data.orders[0])
      } else if (data.order_quantity !== undefined) {
        setSingleItemOrder({
          item_id: selectedInventoryItem.id,
          order_quantity: data.order_quantity,
          estimated_cost: data.estimated_cost || (data.order_quantity * (selectedInventoryItem.cost || 0))
        })
      }
    } catch (error) {
      console.error('Error optimizing single item order:', error)
    } finally {
      setIsOptimizingOne(false)
    }
  }

  const handleOptimizeOrders = async () => {
    if (!predictions.length) {
      console.log('No predictions available for optimization')
      return
    }
    
    setIsLoading(true)
    try {
      console.log('Optimizing orders with predictions:', predictions)
      
      const { data } = await axios.post(`${API_BASE_URL}/optimize_orders/`, {
        Item: inventory.map((i) => ({
          id: i.id,
          cost: i.cost,
          available_stock: i.available_stock,
          predicted_demand:
            predictions.find((p) => p.item_id === i.id)?.predicted_demand || 0
        }))
      })
      
      console.log('Optimization response:', data)
      
      setOptimizedOrders(data.orders || [])
      if (onOrders) onOrders(data.orders || [])
    } catch (error) {
      console.error('Error optimizing orders:', error)
      setOptimizedOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // **NEW: Function to get approximated prediction value**
  const getApproximatedPrediction = (value: number): string => {
    if (value < 10) return `~${Math.ceil(value)}`
    if (value < 100) return `~${Math.round(value / 5) * 5}`
    if (value < 1000) return `~${Math.round(value / 10) * 10}`
    return `~${Math.round(value / 100) * 100}`
  }

  // Derived lists & filtering
  const regions = [...new Set(inventory.map((i) => i.region))]
  const categories = [...new Set(inventory.map((i) => i.category))]
  const items = [...new Set(inventory.map((i) => i.name))]

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const stockoutRisks = predictions.filter((p) => p.stockout_risk).length
  const totalRecommendedOrders = optimizedOrders.reduce((sum, o) => sum + (o.order_quantity || 0), 0)
  const potentialSavings = optimizedOrders.reduce((sum, o) => {
    const itm = inventory.find((i) => i.id === o.item_id)
    return sum + (o.order_quantity * (itm?.cost || 0))
  }, 0)

  return (
    <div className="flex flex-col h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Management</h1>
          <p className="text-gray-600">Track medical supplies and equipment</p>
        </div>
        <div className="space-x-2">
          <Button variant="secondary" icon={<Upload className="w-4 h-4" />}>
            Import
          </Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            Add Item
          </Button>
          <Button variant="primary" onClick={handleAutoFill}>
            Auto-Fill Inventory
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 px-6 py-4">
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-xl font-bold mt-1">{inventory.length}</p>
            </div>
            <Package className="w-6 h-6 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Stockout Risks</p>
              <p className="text-xl font-bold mt-1">{stockoutRisks}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Recommended Orders</p>
              <p className="text-xl font-bold mt-1">{totalRecommendedOrders}</p>
            </div>
            <Package className="w-6 h-6 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Potential Savings</p>
              <p className="text-xl font-bold mt-1">{potentialSavings.toLocaleString()} KES</p>
            </div>
            <DollarSign className="w-6 h-6 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="mx-6 mb-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              className="w-full pl-10 pr-4 py-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-500" />
            <select
              className="border rounded px-3 py-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          
        </div>
      </Card>

      {/* TABLE */}
      <div className="flex-1 overflow-auto px-6">
        <Card className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="info">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.region}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      {/* SINGLE-ITEM PREDICTION CARD */}
      <Card className="mx-6 mb-4 p-4">
        <h2 className="font-semibold mb-3">Predict & Optimize Single Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Region</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Item</option>
              {items
                .filter((name) => {
                  const inv = inventory.find((i) => i.name === name)
                  return (
                    (!selectedRegion || inv?.region === selectedRegion) &&
                    (!selectedCategory || inv?.category === selectedCategory)
                  )
                })
                .map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </select>
          </div>
          <Button
            variant="primary"
            onClick={handlePredictSingleItem}
            disabled={!selectedRegion || !selectedCategory || !selectedItem || isPredictingOne}
            icon={<Activity className="w-4 h-4" />}
          >
            {isPredictingOne ? 'Predicting…' : 'Predict Demand'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleOptimizeSingleItem}
            disabled={!selectedRegion || !selectedCategory || !selectedItem || singlePrediction === null || isOptimizingOne}
            icon={<DollarSign className="w-4 h-4" />}
          >
            {isOptimizingOne ? 'Optimizing…' : 'Optimize Order'}
          </Button>
        </div>
        
        {/* Prediction Results */}
        {singlePrediction !== null && singlePrediction !== undefined && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-800 font-medium">
                  <strong>Prediction Result:</strong> {singlePrediction} units expected demand
                </p>
                <p className="text-blue-600 text-sm">
                  Approximated: {getApproximatedPrediction(singlePrediction)} units
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedItem} | {selectedRegion} | {selectedCategory}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="info">Predicted</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Order Optimization Results */}
        {singleItemOrder && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-800 font-medium">
                  <strong>Recommended Reorder:</strong> {singleItemOrder.order_quantity} units
                </p>
                <p className="text-green-600 text-sm">
                  Estimated Cost: {(singleItemOrder.estimated_cost || singleItemOrder.order_quantity * (inventory.find(i => i.id === singleItemOrder.item_id)?.cost || 0)).toLocaleString()} KES
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Based on predicted demand of {singlePrediction} units
                </p>
              </div>
              <div className="text-right">
                <Badge variant="success">Optimized</Badge>
              </div>
            </div>
          </div>
        )}
        
        {singlePrediction === null && selectedItem && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">
              <strong>Error:</strong> No prediction data received from server for {selectedItem}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Check browser console for more details
            </p>
          </div>
        )}
      </Card>

      {/* RECOMMENDATIONS */}
      {(predictions.length > 0 || optimizedOrders.length > 0) && (
        <div className="px-6 pb-6">
          <Recommendationspanel
            predictions={predictions}
            orders={optimizedOrders}
            inventory={inventory}
          />
        </div>
      )}
    </div>
  )
}