import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Button from './Button'

const CollapsibleSection = ({ 
  title, 
  children, 
  defaultCollapsed = false,
  icon = null,
  className = '',
  headerClassName = '',
  contentClassName = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 ${className}`}>
      <div className={`p-4 ${headerClassName}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </Button>
      </div>
      
      {!isCollapsed && (
        <div className={`px-4 pb-4 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  )
}

export default CollapsibleSection