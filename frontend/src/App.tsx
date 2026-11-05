import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  version: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom d-flex justify-content-between align-items-center">
        <h1 className="h4 text-primary m-0">CampusBites</h1>
        <span className="badge bg-secondary">Sprint 1 Scaffold</span>
      </header>

      <main className="p-5 mb-4 bg-light rounded-3 shadow-sm">
        <div className="container-fluid py-2">
          <h2 className="display-6 fw-bold">Online Food Ordering Platform</h2>
          <p className="col-md-8 fs-5 text-muted">
            CampusBites provides fast, reliable, and fair meal pre-ordering for the university canteen.
          </p>
          <div className="mt-4 p-3 border rounded bg-white">
            <h5 className="mb-2">System Health Status:</h5>
            {loading ? (
              <span className="text-muted">Checking API health...</span>
            ) : health ? (
              <div className="alert alert-success m-0 py-2">
                <strong>Status:</strong> {health.status} | <strong>Version:</strong> {health.version}
              </div>
            ) : (
              <div className="alert alert-warning m-0 py-2">
                Backend API is not reachable yet or starting up.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
