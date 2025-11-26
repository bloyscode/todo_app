import { useState, useEffect } from "react";
import axios from "axios";
import './App.css';

// --- Helper Functions ---
const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const today = formatDate(new Date());

type Task = {
  id: number;
  title: string;
  date: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"today" | "pending" | "overdue">("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 1. FETCH TASKS FROM DATABASE ON LOAD
  useEffect(() => {
    axios.get('http://localhost:8081/tasks')
      .then(res => {
        // MySQL dates might come as full ISO strings, format them to YYYY-MM-DD
        const formattedTasks = res.data.map((t: any) => ({
          ...t,
          date: formatDate(t.date),
          completed: Boolean(t.completed) // Ensure 1/0 becomes true/false
        }));
        setTasks(formattedTasks);
      })
      .catch(err => console.log(err));
  }, []);

  const priorityColor = {
    high: "bg-red-500",
    medium: "bg-yellow-400",
    low: "bg-green-500",
  };

  // --- CRUD Operations (Connected to API) ---

  const toggleComplete = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Update DB
    axios.put(`http://localhost:8081/tasks/${id}`, {
      ...task, 
      completed: !task.completed
    }).then(() => {
      // Update UI
      setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    });
  };

  const deleteTask = (id: number) => {
    axios.delete(`http://localhost:8081/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter((t) => t.id !== id));
      });
  };

  const updateTaskTitle = (id: number, newTitle: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    axios.put(`http://localhost:8081/tasks/${id}`, { ...task, title: newTitle })
      .then(() => {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, title: newTitle } : t)));
      });
  };
  
  const updateTaskDate = (id: number, newDate: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    axios.put(`http://localhost:8081/tasks/${id}`, { ...task, date: newDate })
      .then(() => {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, date: newDate } : t)));
      });
  };

  const addTask = (title: string, date: string, priority: "low" | "medium" | "high") => {
    axios.post('http://localhost:8081/tasks', {
      title,
      date,
      priority
    }).then(res => {
      // The backend returns the new task with the real MySQL ID
      const newTask = res.data; 
      setTasks([...tasks, newTask]);
      setActiveTab(newTask.date === today ? 'today' : 'pending');
      setShowAddModal(false);
    });
  };

  // ... (The rest of your Filtering Logic, AddTaskModal, and TaskItem components remain EXACTLY the same as the previous correct code)
  
  // PASTE THE REST OF THE COMPONENT LOGIC HERE (getFilteredTasks, AddTaskModal, TaskItem, and Return statement)
  // Ensure you use the version from my previous "FIX THE CODE" response where the Edit/Save button logic works.
  
  // --- Filtering Logic ---
  const getFilteredTasks = () => {
    const sortedTasks = tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const pendingTasks = sortedTasks.filter(t => !t.completed);
    const completedTasks = sortedTasks.filter(t => t.completed);

    let filtered: Task[] = [];

    switch (activeTab) {
      case "today":
        filtered = pendingTasks.filter(t => t.date === today);
        break;
      case "pending":
        filtered = pendingTasks.filter(t => t.date >= today);
        break;
      case "overdue":
        filtered = pendingTasks.filter(t => t.date < today);
        break;
    }

    const getTabCount = (tab: "today" | "pending" | "overdue") => {
        if (tab === "today") return pendingTasks.filter(t => t.date === today).length;
        if (tab === "pending") return pendingTasks.filter(t => t.date >= today).length;
        if (tab === "overdue") return pendingTasks.filter(t => t.date < today).length;
        return 0;
    };

    return {
      active: filtered,
      completed: completedTasks,
      getTabCount,
    };
  };

  const { active: activeTasks, completed: completedTasks, getTabCount } = getFilteredTasks();

  // --- Add Task Modal Component ---
  const AddTaskModal = () => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(today);
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (title.trim()) {
        addTask(title.trim(), date, priority);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 shadow-2xl w-full max-w-md text-white">
          <h3 className="text-2xl font-semibold mb-6">Add New Task</h3>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-600 bg-gray-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
              required
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-600 bg-gray-700 rounded-lg focus:ring-green-500 focus:border-green-500 text-white"
              min={formatDate(new Date())}
              required
            />

            <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg border border-gray-600">
              <label className="font-medium">Priority:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="bg-gray-800 border border-gray-500 rounded-md p-2 text-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-6 py-2 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    );
  };

  // --- Task Item Component ---
  const TaskItem = ({ task, toggleComplete, deleteTask, updateTaskTitle, updateTaskDate }: { 
    task: Task, 
    toggleComplete: (id: number) => void, 
    deleteTask: (id: number) => void, 
    updateTaskTitle: (id: number, title: string) => void,
    updateTaskDate: (id: number, date: string) => void
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newTitle, setNewTitle] = useState(task.title);
    const [newDate, setNewDate] = useState(task.date);

    if (task.date !== newDate && !isEditing) setNewDate(task.date);
    if (task.title !== newTitle && !isEditing) setNewTitle(task.title);

    const handleSave = () => {
      if (newTitle.trim() && newTitle.trim() !== task.title) {
        updateTaskTitle(task.id, newTitle.trim());
      }
      if (newDate !== task.date) {
        updateTaskDate(task.id, newDate);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') {
        setNewTitle(task.title);
        setNewDate(task.date);
        setIsEditing(false);
      }
    };

    return (
      <li
        key={task.id}
        className={`group flex justify-between items-center p-4 md:p-5 bg-gray-800 border border-gray-700 rounded-2xl shadow-lg transition-all duration-300 ${task.completed ? "opacity-70" : "opacity-100"}`}
      >
        <div className="flex items-center gap-4 md:gap-5 min-w-0 flex-grow">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task.id)}
              className="peer w-6 h-6 cursor-pointer appearance-none rounded-full border-2 border-green-500 checked:border-green-500 checked:bg-green-500 transition-all"
            />
            <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>

          <div className="flex flex-col min-w-0 flex-grow">
            {isEditing ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`bg-gray-700 text-white p-1 rounded border-b border-green-500 text-lg font-medium w-full min-w-0 mb-1 outline-none`}
                autoFocus
              />
            ) : (
              <span
                className={`text-lg font-medium transition-all cursor-pointer truncate ${task.completed ? "line-through text-gray-500" : "text-white"}`}
                onClick={() => !task.completed && setIsEditing(true)}
                title={task.title}
              >
                {task.title}
              </span>
            )}

            {isEditing ? (
                <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-gray-700 text-gray-400 text-sm p-1 rounded border-b border-green-500 mt-1 w-fit outline-none"
                    min={formatDate(new Date())}
                />
            ) : (
                <span 
                    className={`text-sm cursor-pointer ${task.date < today && !task.completed ? 'text-red-400 font-semibold' : 'text-gray-500'}`}
                    onClick={() => !task.completed && setIsEditing(true)}
                >
                    {task.date === today ? "Today" : task.date}
                </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span
            className={`w-3 h-3 rounded-full ${priorityColor[task.priority]} `}
            title={`Priority: ${task.priority}`}
          ></span>

          {!task.completed && (
            <button
              onClick={() => {
                if (isEditing) handleSave(); 
                else setIsEditing(true);     
              }}
              className={`p-1 transition ${isEditing ? 'text-green-500 hover:text-green-400' : 'text-gray-500 hover:text-blue-400'}`}
              title={isEditing ? "Save Changes" : "Edit Task"}
            >
              {isEditing ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              )}
            </button>
          )}

          <button
            onClick={() => deleteTask(task.id)}
            className="p-1 text-gray-500 hover:text-red-400 transition"
            title="Delete Task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col md:flex-row font-sans overflow-hidden text-white">

      <aside className="w-full md:w-96 flex-shrink-0 bg-gray-800 shadow-xl z-10 flex flex-col">
        <div className="p-6 md:p-10 bg-green-600 md:bg-gray-800 border-b md:border-b-0 border-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Todo App</h1>
          <p className="text-green-200 md:text-gray-400 text-sm mt-1">Organize your priorities.</p>
        </div>

        <div className="px-6 md:px-10 flex-1 flex flex-row md:flex-col gap-2 md:gap-4 py-4 md:py-8 overflow-x-auto md:overflow-visible items-center md:items-stretch no-scrollbar">
          {["today", "pending", "overdue"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "today" | "pending" | "overdue")}
              className={`px-5 py-3 rounded-full md:rounded-xl font-medium transition-all duration-200 text-left flex items-center justify-between whitespace-nowrap ${activeTab === tab ? "bg-black text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}
            >
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center font-semibold ${activeTab === tab ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"}`}>
                {getTabCount(tab as "today" | "pending" | "overdue")}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6 md:p-10 border-t border-gray-700 bg-gray-800">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-green-700/50 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl leading-none mb-1">+</span> New Task
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-gray-900 p-4 md:px-12 md:py-10 scroll-smooth">
        <div className="w-full">
          <header className="flex justify-between items-end mb-8">
            <h2 className="text-3xl font-bold text-white capitalize">{activeTab} Tasks</h2>
            <p className="text-gray-400">Active: <span className="font-semibold text-green-500">{activeTasks.length}</span></p>
          </header>

          <ul className="grid grid-cols-1 gap-4">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  toggleComplete={toggleComplete}
                  deleteTask={deleteTask}
                  updateTaskTitle={updateTaskTitle}
                  updateTaskDate={updateTaskDate}
                />
              ))
            ) : (
              <p className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-lg">No tasks found for "{activeTab}". Time to relax or add a new one!</p>
            )}
          </ul>

          {completedTasks.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-700">
              <p className="flex items-center gap-2 text-gray-500 font-medium mb-4 cursor-pointer hover:text-gray-400 transition-colors">
                <span>Completed ({completedTasks.length})</span><span className="text-sm">▼</span>
              </p>
              <ul className="grid grid-cols-1 gap-3">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    toggleComplete={toggleComplete}
                    deleteTask={deleteTask}
                    updateTaskTitle={updateTaskTitle}
                    updateTaskDate={updateTaskDate}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      {showAddModal && <AddTaskModal />}
    </div>
  );
}