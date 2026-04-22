import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  // 🔐 Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(
        "https://fullandmernproject.onrender.com/expenses",
        {
          headers: { Authorization: token },
        }
      );
      setExpenses(res.data);
    } catch (err) {
      alert("Error fetching expenses");
    }
  };

  const addExpense = async () => {
    try {
      await axios.post(
        "https://fullandmernproject.onrender.com/expense",
        form,
        {
          headers: { Authorization: token },
        }
      );
      fetchExpenses();
    } catch (err) {
      alert("Error adding expense");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>

      <button onClick={logout}>Logout</button>

      <br /><br />

      <input
        placeholder="Title"
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <input
        placeholder="Amount"
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />

      <input
        placeholder="Category"
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />

      <button onClick={addExpense}>Add Expense</button>

      <h3>Expenses</h3>

      {expenses.map((exp, i) => (
        <div key={i}>
          {exp.title} - ₹{exp.amount} ({exp.category})
        </div>
      ))}
    </div>
  );
}

export default Dashboard;