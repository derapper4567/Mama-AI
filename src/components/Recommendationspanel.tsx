import { useState } from 'react';
import { Card } from './UI/Card';
import { Button } from './UI/Button';
import { Badge } from './UI/Badge';
import { AlertTriangle, PackagePlus, ChevronDown, ChevronUp } from 'lucide-react';


interface InventoryItem {
  id: string;
  name: string;
  region: string;
  available_stock: number;
  cost?: number;
}

interface Prediction {
  item_id: string;
  stockout_risk: boolean;
  predicted_demand?: number;
}

interface Order {
  item_id: string;
  order_quantity: number;
}

interface RecommendationsPanelProps {
  predictions: Prediction[];
  orders: Order[];
  inventory: InventoryItem[];
}

export const Recommendationspanel: React.FC<RecommendationsPanelProps> = ({ 
  predictions = [], 
  orders = [], 
  inventory = [] 
}) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  
  const criticalItems = inventory.filter(item => {
    const prediction = predictions.find(p => p.item_id === item.id);
    return prediction?.stockout_risk;
  });

  const potentialSavings = orders.reduce((sum: number, order: Order) => {
    const item = inventory.find(i => i.id === order.item_id);
    return sum + (order.order_quantity * (item?.cost || 0));
  }, 0);

  return (
    <Card>
      <div className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-semibold text-lg">Inventory Recommendations</h3>
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium text-red-600 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Critical Stock Items ({criticalItems.length})
              </h4>
              <ul className="mt-2 space-y-1">
                {criticalItems.slice(0, 3).map(item => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.name} ({item.region})</span>
                    <Badge variant="error">
                      Only {item.available_stock} left
                    </Badge>
                  </li>
                ))}
                {criticalItems.length > 3 && (
                  <li className="text-sm text-gray-500">
                    +{criticalItems.length - 3} more...
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-green-600 flex items-center">
                <PackagePlus className="w-4 h-4 mr-2" />
                Cost Optimization
              </h4>
              <p className="mt-2">
                Potential savings: KES {potentialSavings.toLocaleString()}
              </p>
              <Button variant="secondary" size="sm" className="mt-2">
                Generate Purchase Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};