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
        this.selectedCategory = '';
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
        const deletedCount = document.getElementById('deletedCount');
        const closeDeletedModal = document.getElementById('closeDeletedModal');
        const bgToggleCheckbox = document.getElementById('bgToggleCheckbox');
        const categoryTabs = document.querySelectorAll('.category-tab');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
        clearBtn.addEventListener('click', () => this.clearCompleted());
        deletedCount.addEventListener('click', () => this.showDeletedTasks());
        closeDeletedModal.addEventListener('click', () => this.closeDeletedModal());
        bgToggleCheckbox.addEventListener('change', () => this.toggleBgAnimation());

        categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.filterByCategory(e.target.dataset.category));
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const categorySelect = document.getElementById('categorySelect');
        const taskText = taskInput.value.trim();

        if (taskText === '') {
            alert('请输入任务内容');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            priority: prioritySelect.value,
            category: categorySelect.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.render();
        taskInput.value = '';
        categorySelect.value = '';
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
            // 添加动画效果后重新渲染
            this.animateTaskMove(id, task.completed);
            this.updateStats();
        }
    }

    animateTaskMove(id, isCompleted) {
        const taskElement = document.querySelector(`[data-task-id="${id}"]`);
        if (taskElement) {
            // 获取任务元素的位置信息
            const rect = taskElement.getBoundingClientRect();
            const startY = rect.top;

            // 确定目标列表
            const targetListId = isCompleted ? 'completedTaskList' : 'pendingTaskList';
            const targetList = document.getElementById(targetListId);
            const targetRect = targetList.getBoundingClientRect();
            const endY = targetRect.top;

            // 计算移动距离
            const distance = endY - startY;

            // 应用动画
            if (isCompleted) {
                // 向下滑动到已完成
                taskElement.style.animation = `slideDown ${Math.abs(distance) / 300}s ease-out forwards`;
            } else {
                // 向上滑动到待办
                taskElement.style.animation = `slideUp ${Math.abs(distance) / 300}s ease-out forwards`;
            }

            setTimeout(() => {
                this.renderTaskList();
            }, Math.abs(distance) / 300 * 1000);
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
        if (stored) {
            this.tasks = JSON.parse(stored);
        } else {
            // 初始化默认任务
            this.tasks = this.getDefaultTasks();
            this.saveTasks();
        }
    }

    getDefaultTasks() {
        const now = new Date();
        return [
            {
                id: now.getTime(),
                text: '欢迎使用待办清单ToDo List',
                priority: 'low',
                category: 'life',
                completed: false,
                createdAt: new Date(now.getTime()).toISOString()
            },
            {
                id: now.getTime() + 1,
                text: '在上方输入框内可添加待办事项、设置优先级和分类',
                priority: 'medium',
                category: 'life',
                completed: false,
                createdAt: new Date(now.getTime() - 1000).toISOString()
            },
            {
                id: now.getTime() + 2,
                text: '点击左边勾选框完成一项任务',
                priority: 'high',
                category: 'life',
                completed: false,
                createdAt: new Date(now.getTime() - 2000).toISOString()
            },
            {
                id: now.getTime() + 3,
                text: '完成的事项会显示在这，你可选择删除',
                priority: 'low',
                category: 'life',
                completed: true,
                createdAt: new Date(now.getTime() - 3000).toISOString()
            }
        ];
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
        const pendingList = document.getElementById('pendingTaskList');
        const completedList = document.getElementById('completedTaskList');
        const emptyPending = document.getElementById('emptyPending');
        const emptyCompleted = document.getElementById('emptyCompleted');

        // 分离待办和已完成任务
        let pendingTasks = this.tasks.filter(task => !task.completed);
        let completedTasks = this.tasks.filter(task => task.completed);

        // 按分类筛选
        if (this.selectedCategory) {
            pendingTasks = pendingTasks.filter(task => task.category === this.selectedCategory);
            completedTasks = completedTasks.filter(task => task.category === this.selectedCategory);
        }

        // 渲染待办任务
        this.renderTasksToList(pendingList, pendingTasks, emptyPending);

        // 渲染已完成任务 - 已完成部分始终隐藏空状态
        if (completedTasks.length === 0) {
            completedList.innerHTML = '';
            emptyCompleted.style.display = 'none';
        } else {
            this.renderTasksToList(completedList, completedTasks, emptyCompleted);
        }
    }

    filterByCategory(category) {
        this.selectedCategory = category;

        // 更新标签页的active状态
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            if (tab.dataset.category === category) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        this.render();
    }

    renderTasksToList(listElement, tasks, emptyElement) {
        if (tasks.length === 0) {
            listElement.innerHTML = '';
            emptyElement.style.display = 'flex';
        } else {
            emptyElement.style.display = 'none';

            // 按时间倒序排列（最新的在上面）
            const sortedTasks = [...tasks].sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            // 清空列表但保留动画中的元素
            const existingIds = new Set(Array.from(listElement.children).map(el => el.getAttribute('data-task-id')));

            // 移除不在当前任务列表中的元素
            Array.from(listElement.children).forEach(el => {
                const id = el.getAttribute('data-task-id');
                if (!sortedTasks.find(t => t.id == id)) {
                    el.remove();
                }
            });

            // 添加或更新任务
            sortedTasks.forEach((task, index) => {
                let li = listElement.querySelector(`[data-task-id="${task.id}"]`);

                if (!li) {
                    // 新任务，创建元素
                    li = this.createTaskElement(task);
                    listElement.appendChild(li);
                } else {
                    // 已存在的任务，清除动画样式
                    li.style.animation = 'none';
                }
            });
        }
    }

    createTaskElement(task) {
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

        return li;
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
