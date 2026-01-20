'use client'

import { useState } from 'react'

interface Issue {
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  suggestion?: string
}

interface OptimizationResult {
  issues: Issue[]
  optimizedQuery: string
  estimatedImprovement: number
  complexity: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<OptimizationResult | null>(null)

  const analyzeQuery = () => {
    const issues: Issue[] = []
    let optimizedQuery = query.trim()

    // Check for SELECT *
    if (/SELECT\s+\*/i.test(query)) {
      issues.push({
        severity: 'warning',
        title: 'SELECT * detected',
        description: 'Selecting all columns can reduce performance and increase network overhead.',
        suggestion: 'Specify only the columns you need explicitly.'
      })
    }

    // Check for missing WHERE clause in UPDATE/DELETE
    if (/\b(UPDATE|DELETE)\b/i.test(query) && !/WHERE/i.test(query)) {
      issues.push({
        severity: 'critical',
        title: 'Missing WHERE clause in UPDATE/DELETE',
        description: 'This will affect all rows in the table, which is rarely intended.',
        suggestion: 'Add a WHERE clause to target specific rows.'
      })
    }

    // Check for OR in WHERE clause
    if (/WHERE.*\bOR\b/i.test(query)) {
      issues.push({
        severity: 'info',
        title: 'OR operator in WHERE clause',
        description: 'OR conditions can prevent index usage and slow down queries.',
        suggestion: 'Consider using UNION or restructuring the query with separate conditions.'
      })
    }

    // Check for functions on indexed columns
    if (/WHERE.*\b(UPPER|LOWER|SUBSTRING|DATE|YEAR)\s*\(/i.test(query)) {
      issues.push({
        severity: 'warning',
        title: 'Function on column in WHERE clause',
        description: 'Applying functions to columns prevents index usage.',
        suggestion: 'Apply functions to the comparison value instead, or use computed columns.'
      })
    }

    // Check for NOT IN
    if (/NOT\s+IN/i.test(query)) {
      issues.push({
        severity: 'info',
        title: 'NOT IN operator detected',
        description: 'NOT IN can be inefficient, especially with subqueries.',
        suggestion: 'Consider using NOT EXISTS or LEFT JOIN with NULL check instead.'
      })
      optimizedQuery = optimizedQuery.replace(/NOT\s+IN/gi, 'NOT EXISTS')
    }

    // Check for missing LIMIT on large result sets
    if (/SELECT/i.test(query) && !/LIMIT/i.test(query) && !/TOP/i.test(query)) {
      issues.push({
        severity: 'info',
        title: 'No LIMIT clause',
        description: 'Without a LIMIT, the query may return more rows than needed.',
        suggestion: 'Add LIMIT clause if you only need a subset of results.'
      })
    }

    // Check for LIKE with leading wildcard
    if (/LIKE\s+['"]%/i.test(query)) {
      issues.push({
        severity: 'warning',
        title: 'LIKE with leading wildcard',
        description: 'Leading wildcards prevent index usage and require full table scans.',
        suggestion: 'Avoid leading wildcards or consider full-text search alternatives.'
      })
    }

    // Check for missing JOIN conditions
    if (/JOIN/i.test(query) && !/ON/i.test(query) && !/USING/i.test(query)) {
      issues.push({
        severity: 'critical',
        title: 'JOIN without ON clause',
        description: 'Missing JOIN conditions will produce a Cartesian product.',
        suggestion: 'Add proper ON clause to specify join conditions.'
      })
    }

    // Check for subqueries in SELECT
    if (/SELECT.*\(SELECT/i.test(query)) {
      issues.push({
        severity: 'warning',
        title: 'Subquery in SELECT clause',
        description: 'Subqueries in SELECT run once per row and can be very slow.',
        suggestion: 'Convert to JOIN or use window functions if possible.'
      })
    }

    // Check for DISTINCT
    if (/SELECT\s+DISTINCT/i.test(query)) {
      issues.push({
        severity: 'info',
        title: 'DISTINCT keyword used',
        description: 'DISTINCT requires sorting/grouping which adds overhead.',
        suggestion: 'Verify if DISTINCT is necessary or if duplicates can be prevented earlier.'
      })
    }

    // Optimize query formatting
    if (optimizedQuery) {
      optimizedQuery = optimizedQuery
        .replace(/\bSELECT\b/gi, 'SELECT')
        .replace(/\bFROM\b/gi, '\nFROM')
        .replace(/\bWHERE\b/gi, '\nWHERE')
        .replace(/\bJOIN\b/gi, '\nJOIN')
        .replace(/\bLEFT JOIN\b/gi, '\nLEFT JOIN')
        .replace(/\bRIGHT JOIN\b/gi, '\nRIGHT JOIN')
        .replace(/\bINNER JOIN\b/gi, '\nINNER JOIN')
        .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
        .replace(/\bORDER BY\b/gi, '\nORDER BY')
        .replace(/\bHAVING\b/gi, '\nHAVING')
        .replace(/\bLIMIT\b/gi, '\nLIMIT')
    }

    const criticalCount = issues.filter(i => i.severity === 'critical').length
    const warningCount = issues.filter(i => i.severity === 'warning').length

    const estimatedImprovement = criticalCount * 40 + warningCount * 20 + issues.length * 5

    let complexity = 'Low'
    if (issues.length > 5) complexity = 'High'
    else if (issues.length > 2) complexity = 'Medium'

    setResult({
      issues,
      optimizedQuery: optimizedQuery || query,
      estimatedImprovement: Math.min(estimatedImprovement, 85),
      complexity
    })
  }

  const clearAll = () => {
    setQuery('')
    setResult(null)
  }

  const loadExample = () => {
    setQuery(`SELECT * FROM users
WHERE YEAR(created_at) = 2024
AND status NOT IN (SELECT status FROM inactive_statuses)
OR deleted = 1`)
    setResult(null)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>⚡ SQL Query Optimizer</h1>
        <p>Analyze and optimize your SQL queries for better performance</p>
      </div>

      <div className="main-card">
        <div className="input-section">
          <label htmlFor="query">Enter your SQL query:</label>
          <textarea
            id="query"
            className="sql-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM users WHERE ..."
          />
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={analyzeQuery} disabled={!query.trim()}>
            🔍 Analyze Query
          </button>
          <button className="btn btn-secondary" onClick={loadExample}>
            📝 Load Example
          </button>
          <button className="btn btn-secondary" onClick={clearAll}>
            🗑️ Clear
          </button>
        </div>

        {result && (
          <div className="results">
            <div className="result-section">
              <h3>📊 Analysis Summary</h3>
              <div className="metrics">
                <div className="metric-card">
                  <div className="metric-value">{result.issues.length}</div>
                  <div className="metric-label">Issues Found</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{result.estimatedImprovement}%</div>
                  <div className="metric-label">Est. Improvement</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{result.complexity}</div>
                  <div className="metric-label">Complexity</div>
                </div>
              </div>
            </div>

            {result.issues.length > 0 ? (
              <div className="result-section">
                <h3>⚠️ Issues & Recommendations</h3>
                <ul className="issue-list">
                  {result.issues.map((issue, idx) => (
                    <li key={idx} className={`issue-item issue-${issue.severity}`}>
                      <span className={`issue-badge badge-${issue.severity}`}>
                        {issue.severity}
                      </span>
                      <div className="issue-content">
                        <div className="issue-title">{issue.title}</div>
                        <div className="issue-description">{issue.description}</div>
                        {issue.suggestion && (
                          <div className="issue-suggestion">💡 {issue.suggestion}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="result-section">
                <h3>✅ Great Job!</h3>
                <p>No major issues detected. Your query looks well-optimized!</p>
              </div>
            )}

            <div className="result-section">
              <h3>✨ Formatted Query</h3>
              <pre className="optimized-query">{result.optimizedQuery}</pre>
            </div>
          </div>
        )}

        {!result && query && (
          <div className="empty-state">
            Click "Analyze Query" to start optimization
          </div>
        )}
      </div>
    </div>
  )
}
