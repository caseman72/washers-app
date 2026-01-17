import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const styles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #2a2a2a;
    border-radius: 1rem;
    padding: 1.5rem;
    width: 90%;
    max-width: 320px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  .modal-message {
    font-size: 1rem;
    color: #fff;
    text-align: center;
    margin-bottom: 1.5rem;
    line-height: 1.4;
  }

  .modal-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .modal-btn {
    flex: 1;
    padding: 0.875rem;
    font-size: 1rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background 0.2s;
  }

  .modal-btn-confirm {
    background: #27ae60;
    color: white;
  }

  .modal-btn-confirm:hover {
    background: #2ecc71;
  }

  .modal-btn-cancel {
    background: #333;
    color: white;
  }

  .modal-btn-cancel:hover {
    background: #444;
  }

  .modal-btn-danger {
    background: #c0392b;
    color: white;
  }

  .modal-btn-danger:hover {
    background: #e74c3c;
  }

  .modal-btn-ok {
    background: #333;
    color: white;
  }

  .modal-btn-ok:hover {
    background: #444;
  }
`

interface ConfirmOptions {
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface AlertOptions {
  message: string
  buttonText?: string
}

interface ModalContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
  alert: (options: AlertOptions | string) => Promise<void>
}

const ModalContext = createContext<ModalContextType | null>(null)

export function useConfirm() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useConfirm must be used within ModalProvider')
  return context.confirm
}

export function useAlert() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useAlert must be used within ModalProvider')
  return context.alert
}

interface ModalProviderProps {
  children: ReactNode
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const [alertState, setAlertState] = useState<{
    options: AlertOptions
    resolve: () => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof options === 'string' ? { message: options } : options
    return new Promise((resolve) => {
      setConfirmState({ options: opts, resolve })
    })
  }, [])

  const alert = useCallback((options: AlertOptions | string): Promise<void> => {
    const opts = typeof options === 'string' ? { message: options } : options
    return new Promise((resolve) => {
      setAlertState({ options: opts, resolve })
    })
  }, [])

  const handleConfirm = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result)
      setConfirmState(null)
    }
  }

  const handleAlertClose = () => {
    if (alertState) {
      alertState.resolve()
      setAlertState(null)
    }
  }

  return (
    <ModalContext.Provider value={{ confirm, alert }}>
      {children}

      {confirmState && (
        <div className="modal-overlay" onClick={() => handleConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-message">{confirmState.options.message}</div>
            <div className="modal-buttons">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => handleConfirm(false)}
              >
                {confirmState.options.cancelText || 'Cancel'}
              </button>
              <button
                className={`modal-btn ${confirmState.options.danger ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
                onClick={() => handleConfirm(true)}
              >
                {confirmState.options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {alertState && (
        <div className="modal-overlay" onClick={handleAlertClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-message">{alertState.options.message}</div>
            <div className="modal-buttons">
              <button
                className="modal-btn modal-btn-ok"
                onClick={handleAlertClose}
              >
                {alertState.options.buttonText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{styles}</style>
    </ModalContext.Provider>
  )
}
