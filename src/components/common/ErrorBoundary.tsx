import React from "react"
import { View, StyleSheet } from "react-native"
import { ThemedView } from "../ThemedView"
import { ThemedText } from "../ThemedText"
import { Button } from "./Button"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// ErrorBoundary using class component (required for React error boundaries)
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReload = () => {
    // Reset error state and reload the app (hard reload)
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (typeof window !== "undefined" && window.location) {
      window.location.reload()
    } else {
      // For native, force a remount (not a full reload)
      // You can improve this with a navigation reset if needed
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.title}>
            Something went wrong
          </ThemedText>
          <ThemedText style={styles.message}>
            {this.state.error?.message || "An unexpected error occurred."}
          </ThemedText>
          <Button
            title="Try again"
            onPress={this.handleReload}
            style={styles.button}
          />
        </ThemedView>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    marginBottom: 24,
    textAlign: "center",
    color: "#d32f2f",
  },
  button: {
    minWidth: 120,
  },
})
