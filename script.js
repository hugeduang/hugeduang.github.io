// 待办事项应用 - JavaScript 功能

class TodoApp {
    constructor() {
        this.tasks = [];
        this.deletedTasks = [];
        this.deletedCount = 0;
        this.storageKey = 'todoAppTasks';
        this.deletedCountKey = 'todoAppDeletedCount';
        this.deletedTasksKey = 'todoAppDeletedTasks';
        this.bgAnimationKey = 'todoAppBgAnimation';
        this.bgAnimationEnabled = true;
        this.init();
    }

    init() {
        this.loadTasks();
        this.loadDeletedCount();
        this.loadDeletedTasks();
        this.loadBgAnimationState();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addBtn');
        const taskInput = document.getElementById('taskInput');
        const clearBtn = document.getElementById('clearBtn');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const deletedCount = document.getElementById('deletedCount');
        const closeDeletedModal = document.getElementById('closeDeletedModal');
        const bgToggleCheckbox = document.getElementById('bgToggleCheckbox');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        clearBtn.addEventListener('click', () => this.clearCompleted());
        clearAllBtn.addEventListener('click', () => this.clearAll());
        deletedCount.addEventListener('click', () => this.showDeletedTasks());
        closeDeletedModal.addEventListener('click', () => this.closeDeletedModal());
        bgToggleCheckbox.addEventListener('change', () => this.toggleBgAnimation());
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            alert('请输入任务内容');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            priority: prioritySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.render();
        taskInput.value = '';
        taskInput.focus();
    }

    deleteTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.deletedTasks.push({
                ...task,
                deletedAt: new Date().toISOString()
            });
        }
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.deletedCount++;
        this.saveTasks();
        this.saveDeletedCount();
        this.saveDeletedTasks();
        this.render();
    }

    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        const newText = prompt('编辑任务:', task.text);
        if (newText !== null && newText.trim() !== '') {
            task.text = newText.trim();
            this.saveTasks();
            this.render();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.updateTaskItem(id);
            this.updateStats();
        }
    }

    updateTaskItem(id) {
        const task = this.tasks.find(task => task.id === id);
        if (!task) return;

        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        if (taskElement) {
            if (task.completed) {
                taskElement.classList.add('completed');
            } else {
                taskElement.classList.remove('completed');
            }
        }
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(task => task.completed).length;
        if (completedCount === 0) {
            alert('没有已完成的任务');
            return;
        }
        if (confirm('确定要删除所有已完成的任务吗？')) {
            const completedTasks = this.tasks.filter(task => task.completed);
            completedTasks.forEach(task => {
                this.deletedTasks.push({
                    ...task,
                    deletedAt: new Date().toISOString()
                });
            });
            this.tasks = this.tasks.filter(task => !task.completed);
            this.deletedCount += completedCount;
            this.saveTasks();
            this.saveDeletedCount();
            this.saveDeletedTasks();
            this.render();
        }
    }

    clearAll() {
        if (this.tasks.length === 0) {
            alert('没有任务可清空');
            return;
        }
        if (confirm('确定要删除所有任务吗？此操作无法撤销！')) {
            this.tasks.forEach(task => {
                this.deletedTasks.push({
                    ...task,
                    deletedAt: new Date().toISOString()
                });
            });
            this.deletedCount += this.tasks.length;
            this.tasks = [];
            this.saveTasks();
            this.saveDeletedCount();
            this.saveDeletedTasks();
            this.render();
        }
    }

    saveTasks() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    }

    saveDeletedCount() {
        localStorage.setItem(this.deletedCountKey, this.deletedCount.toString());
    }

    saveDeletedTasks() {
        localStorage.setItem(this.deletedTasksKey, JSON.stringify(this.deletedTasks));
    }

    loadTasks() {
        const stored = localStorage.getItem(this.storageKey);
        this.tasks = stored ? JSON.parse(stored) : [];
    }

    loadDeletedCount() {
        const stored = localStorage.getItem(this.deletedCountKey);
        this.deletedCount = stored ? parseInt(stored) : 0;
    }

    loadDeletedTasks() {
        const stored = localStorage.getItem(this.deletedTasksKey);
        this.deletedTasks = stored ? JSON.parse(stored) : [];
    }

    getStats() {
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = this.tasks.length - completed;
        return { completed, pending };
    }

    render() {
        this.renderTaskList();
        this.updateStats();
    }

    renderTaskList() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');

        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            emptyState.classList.add('show');
            return;
        }

        emptyState.classList.remove('show');

        // 排序：未完成的任务在上，已完成的任务在下
        const sortedTasks = [
            ...this.tasks.filter(task => !task.completed),
            ...this.tasks.filter(task => task.completed)
        ];

        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            const priorityClass = 'priority-' + (task.priority || 'medium');
            li.className = 'task-item ' + priorityClass + (task.completed ? ' completed' : '');
            li.setAttribute('data-task-id', task.id);

            const checkboxState = task.completed ? 'checked' : '';
            const createdTime = new Date(task.createdAt).toLocaleString('zh-CN');
            li.innerHTML = '<input type="checkbox" class="task-checkbox" ' + checkboxState + ' data-id="' + task.id + '"><div class="task-content"><span class="task-text">' + this.escapeHtml(task.text) + '</span><span class="task-time">📅 ' + createdTime + '</span></div><button class="edit-btn" data-id="' + task.id + '">编辑</button><button class="delete-btn" data-id="' + task.id + '">删除</button>';

            const checkbox = li.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const editBtn = li.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => this.editTask(task.id));

            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            taskList.appendChild(li);
        });
    }

    updateStats() {
        const stats = this.getStats();
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('deletedCount').textContent = this.deletedCount;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showDeletedTasks() {
        const modal = document.getElementById('deletedModal');
        const deletedTasksList = document.getElementById('deletedTasksList');

        if (this.deletedTasks.length === 0) {
            deletedTasksList.innerHTML = '<div class="empty-deleted-list">暂无已删除的任务</div>';
        } else {
            deletedTasksList.innerHTML = '';
            this.deletedTasks.forEach(task => {
                const div = document.createElement('div');
                div.className = 'deleted-task-item';
                const deletedTime = new Date(task.deletedAt).toLocaleString('zh-CN');
                div.innerHTML = '<span class="deleted-task-text">' + this.escapeHtml(task.text) + '</span><span class="deleted-task-time">' + deletedTime + '</span>';
                deletedTasksList.appendChild(div);
            });
        }

        modal.style.display = 'flex';
    }

    closeDeletedModal() {
        const modal = document.getElementById('deletedModal');
        modal.style.display = 'none';
    }

    toggleBgAnimation() {
        this.bgAnimationEnabled = !this.bgAnimationEnabled;
        this.saveBgAnimationState();
        this.applyBgAnimation();
    }

    applyBgAnimation() {
        const body = document.body;
        const checkbox = document.getElementById('bgToggleCheckbox');

        if (this.bgAnimationEnabled) {
            body.classList.remove('static-bg');
            checkbox.checked = true;
        } else {
            body.classList.add('static-bg');
            checkbox.checked = false;
        }
    }

    saveBgAnimationState() {
        localStorage.setItem(this.bgAnimationKey, this.bgAnimationEnabled.toString());
    }

    loadBgAnimationState() {
        const stored = localStorage.getItem(this.bgAnimationKey);
        this.bgAnimationEnabled = stored === null ? true : stored === 'true';
        this.applyBgAnimation();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
