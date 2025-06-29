import React from 'react'

const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter

export default Card