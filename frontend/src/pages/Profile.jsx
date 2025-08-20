"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../contexts/authContext"
import { User, Mail, Calendar, Shield, Edit, X } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import { format } from "date-fns"

// Design system variables (same as tasks page)
const colors = {
  primary: {
    dark: "#0A122A",
    light: "#E7DECD",
    accent: "#E76F51",
    muted: "rgba(231, 222, 205, 0.7)",
    subtle: "rgba(231, 222, 205, 0.1)",
    border: "rgba(231, 222, 205, 0.2)"
  },
  status: {
    user: { bg: "#BFDBFE", text: "#1E40AF" },
    admin: { bg: "#FEF3C7", text: "#92400E" }
  }
};

// Common UI Components
const Button = ({ children, variant = "primary", size = "md", className = "", ...props }) => {
  const baseClasses = "flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2";
  
  const variants = {
    primary: "bg-primary-light text-primary-dark hover:bg-opacity-90 focus:ring-primary-light",
    secondary: "bg-transparent border border-primary-border text-primary-light hover:bg-primary-subtle focus:ring-primary-light",
    danger: "bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500",
    ghost: "bg-transparent text-primary-light hover:bg-primary-subtle focus:ring-primary-light"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`rounded-xl bg-primary-subtle border border-primary-border p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const Input = ({ className = "", ...props }) => {
  return (
    <input 
      className={`w-full px-4 py-2.5 rounded-lg border border-primary-border bg-primary-dark text-primary-light placeholder-primary-muted focus:outline-none focus:ring-2 focus:ring-primary-light ${className}`}
      {...props}
    />
  );
};

const Badge = ({ children, style, className = "" }) => {
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

const Profile = () => {
  const { user, updateProfile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  })

  const onSubmit = async (data) => {
    const result = await updateProfile(data)
    if (result.success) {
      setIsEditing(false)
      reset(data)
    }
  }

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    })
    setIsEditing(false)
  }

  const getRoleBadge = (role) => {
    return {
      backgroundColor: colors.status[role]?.bg || colors.status.user.bg,
      color: colors.status[role]?.text || colors.status.user.text
    };
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{backgroundColor: "rgba(231, 222, 205, 0.2)"}}>
            <span className="text-xl font-bold" style={{color: "#E7DECD"}}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{color: "#E7DECD"}}>{user?.firstName} {user?.lastName}</h1>
            <p style={{color: "rgba(231, 222, 205, 0.8)"}}>{user?.email}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Shield className="h-4 w-4" style={{color: "rgba(231, 222, 205, 0.7)"}} />
              <Badge style={getRoleBadge(user?.role)}>
                {user?.role}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Information */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium" style={{color: "#E7DECD"}}>Profile Information</h2>
          {!isEditing && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>First name</label>
                <Input
                  {...register("firstName", {
                    required: "First name is required",
                    maxLength: {
                      value: 50,
                      message: "First name must be less than 50 characters",
                    },
                  })}
                  type="text"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>Last name</label>
                <Input
                  {...register("lastName", {
                    required: "Last name is required",
                    maxLength: {
                      value: 50,
                      message: "Last name must be less than 50 characters",
                    },
                  })}
                  type="text"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium" style={{color: "#E7DECD"}}>Email address</label>
              <Input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                type="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm" style={{color: "#E76F51"}}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : "Save Changes"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>First name</label>
                <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>{user?.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Last name</label>
                <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>{user?.lastName}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Email address</label>
              <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Role</label>
              <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>
                <Badge style={getRoleBadge(user?.role)}>
                  {user?.role}
                </Badge>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium" style={{color: "rgba(231, 222, 205, 0.8)"}}>Member since</label>
              <p className="mt-1 text-sm" style={{color: "#E7DECD"}}>
                {user?.createdAt && format(new Date(user.createdAt), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Account Statistics */}
      <Card>
        <h2 className="text-lg font-medium mb-4" style={{color: "#E7DECD"}}>Account Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full" style={{backgroundColor: "rgba(231, 222, 205, 0.2)"}}>
              <User className="w-6 h-6" style={{color: "#E7DECD"}} />
            </div>
            <p className="mt-2 text-sm font-medium" style={{color: "#E7DECD"}}>Profile</p>
            <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>Complete</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full" style={{backgroundColor: "rgba(231, 222, 205, 0.2)"}}>
              <Mail className="w-6 h-6" style={{color: "#E7DECD"}} />
            </div>
            <p className="mt-2 text-sm font-medium" style={{color: "#E7DECD"}}>Email</p>
            <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>Verified</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-full" style={{backgroundColor: "rgba(231, 222, 205, 0.2)"}}>
              <Calendar className="w-6 h-6" style={{color: "#E7DECD"}} />
            </div>
            <p className="mt-2 text-sm font-medium" style={{color: "#E7DECD"}}>Active</p>
            <p className="text-xs" style={{color: "rgba(231, 222, 205, 0.7)"}}>
              {user?.createdAt && format(new Date(user.createdAt), "MMM yyyy")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Profile