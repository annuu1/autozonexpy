import React from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg',
  fullScreen = false,
  className = '' 
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
  }

  const modalClasses = fullScreen 
    ? 'w-full h-full m-0 rounded-none' 
    : `w-full ${sizeClasses[size]} mx-4 max-h-[90vh] rounded-2xl`

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className={`bg-white/95 backdrop-blur-lg shadow-2xl border border-white/30 overflow-hidden ${modalClasses} ${className}`}>
        {title && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              icon={<X size={16} />}
              className="!p-2"
            />
          </div>
        )}
        <div className={fullScreen ? 'h-[calc(100vh-80px)] overflow-auto' : 'max-h-[80vh] overflow-auto'}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal