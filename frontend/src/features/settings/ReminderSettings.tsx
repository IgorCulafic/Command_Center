import { useEffect, useState } from "react"
import { Bell, BellOff, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import {
  disablePush,
  enablePush,
  isPushEnabled,
  pushSupported,
} from "@/lib/push"

/** Enable / disable the daily push digest, and send a test. */
export function ReminderSettings() {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supported = pushSupported()
  const secure = typeof window !== "undefined" && window.isSecureContext

  useEffect(() => {
    void isPushEnabled().then(setEnabled)
  }, [])

  const onEnable = async () => {
    setBusy(true)
    setMessage(null)
    const res = await enablePush()
    if (res.ok) {
      setEnabled(true)
      setMessage("Reminders enabled — you'll get a daily digest of your top priorities.")
    } else {
      setMessage(res.reason ?? "Couldn't enable reminders.")
    }
    setBusy(false)
  }

  const onDisable = async () => {
    setBusy(true)
    setMessage(null)
    await disablePush()
    setEnabled(false)
    setMessage("Reminders disabled on this device.")
    setBusy(false)
  }

  const onTest = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const r = await api.pushTest()
      setMessage(
        r.subscriptions === 0
          ? "No devices subscribed yet — enable reminders first."
          : `Test digest sent to ${r.sent} device(s).`,
      )
    } catch {
      setMessage("Test failed.")
    }
    setBusy(false)
  }

  return (
    <section className="rounded-xl border bg-card/40 p-4">
      <h2 className="text-base font-semibold tracking-tight">Reminders</h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">
        A daily push with your top priorities. Install the app to your home screen
        first. Web push needs HTTPS — over Tailscale, enable it with{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">tailscale serve</code>{" "}
        (see the README).
      </p>

      {!supported ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This browser doesn't support web push.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {enabled ? (
            <Button
              variant="outline"
              onClick={onDisable}
              disabled={busy}
              className="gap-1.5"
            >
              <BellOff className="size-4" />
              Disable
            </Button>
          ) : (
            <Button onClick={onEnable} disabled={busy} className="gap-1.5">
              <Bell className="size-4" />
              Enable reminders
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onTest}
            disabled={busy}
            className="gap-1.5"
          >
            <Send className="size-4" />
            Send test
          </Button>
          {!secure && (
            <span className="text-xs text-amber-500">needs HTTPS / localhost</span>
          )}
        </div>
      )}

      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </section>
  )
}
