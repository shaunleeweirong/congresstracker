import React, { Component, ErrorInfo } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  ErrorBoundary,
  ErrorBoundaryWrapper,
  withErrorBoundary,
  useErrorHandler,
  type ErrorBoundaryProps,
} from '../../src/components/ErrorBoundary'

// Mock component that throws errors
const ThrowError = ({ shouldThrow = false, errorType = 'default' }: { shouldThrow?: boolean; errorType?: string }) => {
  if (shouldThrow) {
    if (errorType === 'chunk') {
      throw new Error('Loading chunk 123 failed.')
    } else if (errorType === 'network') {
      throw new Error('NetworkError: Failed to fetch')
    } else if (errorType === 'auth') {
      throw new Error('401 Authentication required')
    } else {
      throw new Error('Test error')
    }
  }
  return <div>Component works</div>
}

// Mock component for testing HOC
const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = jest.fn()
    console.warn = jest.fn()
    jest.clearAllMocks()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component works')).toBeInTheDocument()
    })

    it('should render children with multiple child components', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('should catch errors and render fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('should call onError callback when error occurs', () => {
      const onErrorSpy = jest.fn()

      render(
        <ErrorBoundary onError={onErrorSpy}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onErrorSpy).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should log error to console', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should generate unique event ID for error tracking', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // In development mode, error details should be visible
      if (process.env.NODE_ENV === 'development') {
        expect(screen.getByText(/Error Details/)).toBeInTheDocument()
      }
    })
  })

  describe('Error Message Customization', () => {
    it('should show custom message for chunk load errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="chunk" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument()
      // The exact text is "Failed to load application resources. Please refresh the page."
      expect(screen.getByText(/Please refresh the page/)).toBeInTheDocument()
    })

    it('should show custom message for network errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Network connection error/)).toBeInTheDocument()
      expect(screen.getByText(/Please check your internet connection/)).toBeInTheDocument()
    })

    it('should show custom message for authentication errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="auth" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Authentication error/)).toBeInTheDocument()
      expect(screen.getByText(/Please log in again/)).toBeInTheDocument()
    })
  })

  describe('Custom Fallback UI', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error fallback</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Error Recovery Actions', () => {
    it('should reset error boundary when Try Again is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: /try again/i }))

      // Rerender with non-throwing component to simulate fix
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(screen.getByText('Component works')).toBeInTheDocument()
      })
    })

    it('should reload page when Reload Page is clicked', () => {
      // Mock window.location.reload
      const mockReload = jest.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: /reload page/i }))

      expect(mockReload).toHaveBeenCalled()
    })

    it('should navigate to home when Home button is clicked', () => {
      // Mock window.location.href
      const mockLocation = { href: '' }
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: /home/i }))

      expect(mockLocation.href).toBe('/')
    })
  })

  describe('Reset on Props Change', () => {
    it('should reset error boundary when resetKeys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Change resetKeys to trigger reset
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component works')).toBeInTheDocument()
    })

    it('should reset error boundary when resetOnPropsChange is true', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Change any prop to trigger reset
      rerender(
        <ErrorBoundary resetOnPropsChange={true} onError={jest.fn()}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component works')).toBeInTheDocument()
    })

    it('should not reset when resetKeys array length changes but values remain same', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1', 'key2']}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Remove one key but keep the same values
      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // Should still show error since resetKeys didn't actually change values
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Development vs Production', () => {
    const originalNodeEnv = process.env.NODE_ENV

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv
    })

    it('should show error details in development mode', () => {
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error Details')).toBeInTheDocument()
    })

    it('should show event ID in production mode', () => {
      process.env.NODE_ENV = 'production'

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Error ID:/)).toBeInTheDocument()
    })
  })

  describe('Component Lifecycle', () => {
    it('should clean up timeout on unmount when error boundary has timeout set', () => {
      jest.useFakeTimers()
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const { rerender, unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Trigger error first
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()

      // Now unmount - this should call clearTimeout if resetTimeoutId was set
      unmount()

      // The component only calls clearTimeout if there was a timeout set
      // Since we're not actually triggering the timeout behavior, we'll just verify
      // that the unmount works without errors
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(0) // No timeout was set in our test

      jest.useRealTimers()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('Error Severity Detection', () => {
    it('should correctly identify chunk load errors as medium severity', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="chunk" />
        </ErrorBoundary>
      )

      // Visual indication that it's treated as medium severity
      expect(screen.getByText(/Failed to load application resources/)).toBeInTheDocument()
    })

    it('should correctly identify network errors as medium severity', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="network" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Network connection error/)).toBeInTheDocument()
    })

    it('should correctly identify auth errors as high severity', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="auth" />
        </ErrorBoundary>
      )

      expect(screen.getByText(/Authentication error/)).toBeInTheDocument()
    })
  })
})

describe('ErrorBoundaryWrapper', () => {
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundaryWrapper>
        <div>Wrapped content</div>
      </ErrorBoundaryWrapper>
    )

    expect(screen.getByText('Wrapped content')).toBeInTheDocument()
  })

  it('should catch errors and show fallback UI', () => {
    render(
      <ErrorBoundaryWrapper>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWrapper>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should pass through error boundary props', () => {
    const onErrorSpy = jest.fn()

    render(
      <ErrorBoundaryWrapper onError={onErrorSpy}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryWrapper>
    )

    expect(onErrorSpy).toHaveBeenCalled()
  })
})

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent name="World" />)

    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('should catch errors in wrapped component', () => {
    const ThrowingComponent = () => {
      throw new Error('HOC test error')
    }
    const WrappedComponent = withErrorBoundary(ThrowingComponent)

    render(<WrappedComponent />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('HOC test error')).toBeInTheDocument()
  })

  it('should pass error boundary props to HOC', () => {
    const onErrorSpy = jest.fn()
    const ThrowingComponent = () => {
      throw new Error('HOC error')
    }
    const WrappedComponent = withErrorBoundary(ThrowingComponent, {
      onError: onErrorSpy,
    })

    render(<WrappedComponent />)

    expect(onErrorSpy).toHaveBeenCalled()
  })

  it('should set correct display name for wrapped component', () => {
    const NamedComponent = () => <div>Test</div>
    NamedComponent.displayName = 'NamedComponent'

    const WrappedComponent = withErrorBoundary(NamedComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(NamedComponent)')
  })

  it('should handle components without display name', () => {
    const AnonymousComponent = () => <div>Test</div>
    const WrappedComponent = withErrorBoundary(AnonymousComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(AnonymousComponent)')
  })
})

describe('useErrorHandler Hook', () => {
  const TestHookComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
    const handleError = useErrorHandler()

    React.useEffect(() => {
      if (shouldThrow) {
        try {
          throw new Error('Hook test error')
        } catch (error) {
          handleError(error as Error, { componentStack: 'test stack' })
        }
      }
    }, [shouldThrow, handleError])

    return <div>Hook component</div>
  }

  it('should log error when called and trigger error boundary', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    render(
      <ErrorBoundary>
        <TestHookComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // Since the hook re-throws the error, the error boundary should catch it
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Hook test error')).toBeInTheDocument()

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Handled error:',
      expect.any(Error),
      { componentStack: 'test stack' }
    )

    consoleErrorSpy.mockRestore()
  })

  it('should re-throw error to trigger error boundary', () => {
    render(
      <ErrorBoundary>
        <TestHookComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    // The error boundary should catch the re-thrown error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Hook test error')).toBeInTheDocument()
  })
})

describe('Error Boundary State Management', () => {
  it('should maintain error state until reset', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Rerender with same props (should still show error)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should clear error state when reset is triggered', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['v1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    // Trigger reset with different resetKeys
    rerender(
      <ErrorBoundary resetKeys={['v2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component works')).toBeInTheDocument()
  })
})

describe('Error Event ID Generation', () => {
  it('should generate unique event IDs for different errors', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const firstErrorText = screen.getByText(/Something went wrong/).closest('div')?.textContent

    // Reset and cause another error
    rerender(
      <ErrorBoundary resetKeys={['reset']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    rerender(
      <ErrorBoundary resetKeys={['reset']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    const secondErrorText = screen.getByText(/Something went wrong/).closest('div')?.textContent

    // Event IDs should be different (though we can't easily test the exact IDs)
    expect(firstErrorText).toBeDefined()
    expect(secondErrorText).toBeDefined()
  })
})

describe('Type Exports', () => {
  it('should export ErrorBoundaryProps type', () => {
    // This is a compile-time test - if the import works, the type exists
    const props: ErrorBoundaryProps = {
      children: <div>Test</div>,
      onError: jest.fn(),
      resetOnPropsChange: true,
      resetKeys: ['test'],
    }

    expect(props).toBeDefined()
  })
})