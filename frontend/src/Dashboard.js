// frontend/src/Dashboard.js
import React from 'react';

function Dashboard({ books, members, transactions }) {
  // Calculate stats
  const totalBooks = books.length;
  const totalMembers = members.length;
  const issuedBooks = transactions.filter(t => t.status === 'Issued').length;
  
  // Calculate overdue books
  const today = new Date();
  const overdueBooks = transactions.filter(t => {
    if (t.status === 'Issued' && t.dueDate) {
      const dueDate = new Date(t.dueDate);
      return dueDate < today;
    }
    return false;
  }).length;

  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
    .slice(0, 5);

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card books">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>Total Books</h3>
            <p className="stat-number">{totalBooks}</p>
          </div>
        </div>

        <div className="stat-card members">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Total Members</h3>
            <p className="stat-number">{totalMembers}</p>
          </div>
        </div>

        <div className="stat-card issued">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>Issued Books</h3>
            <p className="stat-number">{issuedBooks}</p>
          </div>
        </div>

        <div className="stat-card overdue">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Overdue Books</h3>
            <p className="stat-number">{overdueBooks}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Transactions</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map(t => {
                  const book = books.find(b => b._id === t.book?._id || t.book);
                  const member = members.find(m => m._id === t.member?._id || t.member);
                  const isOverdue = t.status === 'Issued' && new Date(t.dueDate) < new Date();
                  
                  return (
                    <tr key={t._id}>
                      <td>{book?.title || 'Unknown'}</td>
                      <td>{member?.name || 'Unknown'}</td>
                      <td>{new Date(t.issueDate).toLocaleDateString()}</td>
                      <td className={isOverdue ? 'overdue-date' : ''}>
                        {new Date(t.dueDate).toLocaleDateString()}
                        {isOverdue && ' ⚠️'}
                      </td>
                      <td>
                        <span className={`status-badge ${t.status.toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                    No transactions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;