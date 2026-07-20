import { useDashboardContext } from "@/hooks/DashboardContext";

export default function RulesEditor() {
  const { rules } = useDashboardContext();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-ink-900)", letterSpacing: "-0.02em" }}>
          Allocation Rules
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "6px" }}>
          Set up automated routing for incoming funds using natural language.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rules.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", color: "var(--color-ink-500)", fontSize: "0.875rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            No allocation rules configured yet.
          </div>
        ) : rules.map((r) => (
          <div key={r.id} className="card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                backgroundColor: r.isActive ? "var(--color-jade-light)" : "var(--color-bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.25rem", border: "1px solid var(--color-border)"
              }}>
                {r.isActive ? "⚡" : "⏸️"}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "var(--color-ink-900)" }}>{r.name}</p>
                <p style={{ fontSize: "0.875rem", color: "var(--color-ink-500)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
                  {r.condition} {'->'} {r.action}
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <div style={{
                  width: "36px", height: "20px", borderRadius: "10px",
                  backgroundColor: r.isActive ? "var(--color-jade)" : "var(--color-ink-300)",
                  position: "relative",
                  transition: "background-color 0.2s"
                }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "#fff",
                    position: "absolute", top: "2px", left: r.isActive ? "18px" : "2px",
                    transition: "left 0.2s"
                  }} />
                </div>
              </label>
              <button className="btn btn-ghost" style={{ padding: "8px" }}>Edit</button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "16px" }}>
        <button className="btn btn-primary">
          + Create New Rule
        </button>
      </div>
    </div>
  );
}
