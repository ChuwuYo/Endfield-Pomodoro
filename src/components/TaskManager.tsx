
import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { Language } from '../types';
import { Panel, Input, Button } from './TerminalUI';
import { useTranslation } from '../utils/i18n';

interface TaskManagerProps {
  language: Language;
}

const MAX_TASKS = 6;
const STORAGE_KEY = 'origin_terminal_tasks';

const TaskManager: React.FC<TaskManagerProps> = ({ language }) => {
  const t = useTranslation(language);

  // 在挂载时从LocalStorage加载 - 直接初始化状态
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load tasks', e);
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');

  // 更新时保存到LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!inputValue.trim()) return;
    if (tasks.length >= MAX_TASKS) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      completed: false,
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
  }

  const isFull = tasks.length >= MAX_TASKS;

  return (
    <Panel className="h-full p-6" title={t('TASK_MODULE')}>
      <div className="flex flex-col h-full w-full relative">
        {/* Header Info with Counter */}
        <div className="absolute -top-2 right-0 text-[10px] font-mono tracking-widest text-theme-dim">
          {t('CAPACITY')}: <span className={`${isFull ? 'text-red-500' : 'text-theme-primary'}`}>{tasks.length}</span>/{MAX_TASKS}
        </div>

        <div className="flex gap-2 mb-4 mt-4 w-full shrink-0">
          <div className="flex-1 min-w-0">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isFull ? 'CAPACITY REACHED' : t('ADD_TASK_PLACEHOLDER')}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              className="w-full"
              disabled={isFull}
            />
          </div>
          <Button
            onClick={addTask}
            disabled={isFull || !inputValue.trim()}
            className="min-w-[60px] px-0 flex-shrink-0"
          >
            {t('ADD_TASK')}
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-2 custom-scrollbar relative">
          {tasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-theme-dim/50 border-2 border-dashed border-theme-highlight/30 rounded box-border">
              <div className="text-4xl mb-2 opacity-50">
                <i className="ri-flashlight-line text-5xl"></i>
              </div>
              <span className="font-mono text-xs tracking-widest uppercase">{t('NO_TASKS')}</span>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-3 border border-theme-highlight/50 bg-black/20 hover:bg-theme-highlight/20 transition-all duration-300 ${task.completed ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${task.completed ? 'bg-theme-primary border-theme-primary text-black' : 'border-theme-dim hover:border-theme-primary'}`}
                    title={t('TOGGLE_TASK')}
                  >
                    {task.completed && (
                      <i className="ri-check-line text-xs font-bold"></i>
                    )}
                  </button>
                  <span className={`font-mono text-sm truncate transition-all ${task.completed ? 'line-through text-theme-dim' : 'text-theme-text'}`}>
                    {task.text}
                  </span>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-theme-dim hover:text-red-500 transition-all px-2 flex-shrink-0"
                  title={t('DELETE_TASK')}
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            ))
          )}
        </div>

        {tasks.some(t => t.completed) && (
          <div className="mt-4 pt-2 border-t border-theme-highlight flex justify-end shrink-0">
            <button onClick={clearCompleted} className="text-[10px] font-mono uppercase tracking-widest text-theme-dim hover:text-theme-primary transition-colors flex items-center gap-1" title={t('CLEAR_ALL_TASKS')}>
              [{t('CLEAR_COMPLETED')}]
            </button>
          </div>
        )}
      </div>
    </Panel>
  );
};

export default TaskManager;
