const { h } = window.App.VDOM;
const { useState, useEffect } = window.App.Hooks;
const { init, addRoute, Link, Outlet, navbarDynamic } = window.App.Router;

// Navbar đơn giản (không auth)
function Navbar() {
  return h('nav', null,
    h(Link, { to: '/', children: 'Home' }),
    ' | ',
    h(Link, { to: '/about', children: 'About' }),
    ' | ',
    h(Link, { to: '/tasks', children: 'Quản lý Tasks (CRUD)' })
  );
}

// Trang chủ
function Home() {
  return h('div', { className: 'container' },
    h('h1', null, 'Chào mừng đến với Framework Tự Build!'),
    h('p', null, 'Demo CRUD đơn giản với Supabase (bảng tasks).'),
    h('p', null, 'Không cần đăng nhập.')
  );
}

function About() {
  return h('div', { className: 'container' },
    h('h1', null, 'Giới Thiệu'),
    h('p', null, 'Framework frontend nhẹ tự build: VDOM + Hooks + Router.'),
    h('p', null, 'Tích hợp Supabase để thao tác database realtime.')
  );
}

// Component CRUD Tasks
function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load tasks
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Lỗi load: ' + error.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  // Add task
  const addTask = async () => {
    if (!newTitle.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .insert({ title: newTitle.trim() });

    if (error) {
      setMessage('Lỗi thêm: ' + error.message);
    } else {
      setNewTitle('');
      fetchTasks();
      setMessage('Thêm thành công!');
    }
    setLoading(false);
  };

  // Update task
  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) return;
    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .update({ title: editTitle.trim() })
      .eq('id', editingId);

    if (error) {
      setMessage('Lỗi sửa: ' + error.message);
    } else {
      setEditingId(null);
      fetchTasks();
      setMessage('Sửa thành công!');
    }
    setLoading(false);
  };

  // Toggle completed
  const toggleCompleted = async (task) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (!error) fetchTasks();
  };

  // Delete task
  const deleteTask = async (id) => {
    setLoading(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage('Lỗi xóa: ' + error.message);
    } else {
      fetchTasks();
      setMessage('Xóa thành công!');
    }
    setLoading(false);
  };

  return h('div', { className: 'container' },
    h('h1', null, 'Quản lý Tasks (CRUD Demo)'),
    
    // Form thêm task
    h('div', { style: { marginBottom: '2rem' } },
      h('input', {
        type: 'text',
        placeholder: 'Nhập tiêu đề task mới',
        value: newTitle,
        onInput: e => setNewTitle(e.target.value),
        disabled: loading
      }),
      h('button', { onClick: addTask, disabled: loading || !newTitle.trim() }, 'Thêm Task')
    ),

    // Message
    message && h('p', { style: { color: message.includes('Lỗi') ? 'red' : 'green' } }, message),

    // Danh sách tasks
    loading ? h('p', null, 'Đang tải...') :
    h('ul', { style: { listStyle: 'none', padding: 0 } },
      tasks.map(task =>
        h('li', { key: task.id, style: { marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc' } },
          h('input', {
            type: 'checkbox',
            checked: task.completed || false,
            onChange: () => toggleCompleted(task)
          }),
          ' ',
          editingId === task.id ?
            h('span', null,
              h('input', {
                type: 'text',
                value: editTitle,
                onInput: e => setEditTitle(e.target.value)
              }),
              ' ',
              h('button', { onClick: saveEdit }, 'Lưu'),
              h('button', { onClick: () => setEditingId(null) }, 'Hủy')
            ) :
            h('span', { style: { textDecoration: task.completed ? 'line-through' : 'none' } },
              task.title
            ),
          '   ',
          editingId !== task.id && h('button', { onClick: () => startEdit(task) }, 'Sửa'),
          ' ',
          h('button', { onClick: () => deleteTask(task.id), style: { color: 'red' } }, 'Xóa')
        )
      )
    )
  );
}

// Đăng ký routes
addRoute('/', Home);
addRoute('/about', About);
addRoute('/tasks', Tasks);

navbarDynamic({ navbar: Navbar });

// Khởi động router
init(document.getElementById('app'), { hash: false });