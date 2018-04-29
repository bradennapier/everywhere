/* @flow */

export default function handleTaskCleanup(category: string, id: string, task): void {
  const categoryTasks = this.getCategory(category);
  if (categoryTasks && categoryTasks.has(id)) {
    const savedTask = categoryTasks.get(id);
    if (savedTask === task) {
      categoryTasks.delete(id);
      if (categoryTasks.size === 0) {
        this.tasks.delete(category);
        this.handleCategoryComplete(category);
      }
    }
  }
}
