import { clsx } from "clsx"

const LoadingSpinner = ({ size = "md", className }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <div
        className={clsx(
          "animate-spin rounded-full border-2 border-t-transparent", 
          sizeClasses[size]
        )}
        style={{
          borderColor: "rgba(231, 222, 205, 0.3)",
          borderTopColor: "#E7DECD"
        }}
      />
    </div>
  )
}

export default LoadingSpinner