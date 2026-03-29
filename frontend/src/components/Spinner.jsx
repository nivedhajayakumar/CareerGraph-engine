export default function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-2'
  }
  return (
    <div className={`${sizes[size]} border-purple-600 border-t-transparent
                     rounded-full animate-spin`}/>
  )
}