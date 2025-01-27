/**
 * ★★★★★★★★★★★★★★★★★★★★
 * Лети со мной, мой милый,    // Лети зі мною, мій милий,
 * К звёздам, где мечты светили.  // До зірок, де мрії світять.
 * Держи меня крепко, не отпускай,  // Тримай мене міцно, не відпускай.
 * Мгновение вечно — не забывай.  // Мить вічна — не забувай.
 * 
 * Пока всё было, пусть замрёт,  // Поки все було, нехай замре.
 * Время не вернётся, пусть не ждёт. // Час не повернеться, нехай не чекає.
 * Всё было навсегда,  // Все було назавжди.
 * В космоса бескрайняя утренняя звезда. // В безкрайній космос, рання зірка.
 * ★★★★★★★★★★★★★★★★★★★★
 */
 // Lum Studio //
import { system } from "@minecraft/server";
/**
 * Class for endless object databases
 */
export class EndlessDB {
    prefix = '';
    /**
     * 
     * @param {string} prefix Prefix for the database. Should be unique for each DB
     */
    constructor(prefix) {
      this.prefix = prefix
    }
    /**
     * Count of used dynamic properties for this DB
     */
    get count() {
      return world.getDynamicProperty(this.prefix + "count") ?? 1
    }
    set count(value) {
      world.setDynamicProperty(this.prefix + "count", value)
    }
    /**
     * Gets all data stored in DB
     * @returns Database object
     */
    getAll() {
      let json = '';
      for (let i = 0; i < this.count; i++) {
        json += world.getDynamicProperty(this.prefix + "part_" + i) ?? ""
      }
      return JSON.parse(json === "" ? "{}" : json)
    }
    /**
     * 
     * @param {object} object Saves given data into DB (rewriting)
     */
    setAll(object) {
      let json = JSON.stringify(object);
      let i = 0;
      while (json.length !== 0) {
        world.setDynamicProperty(this.prefix + "part_" + i, json.slice(0, 32767))
        json = json.slice(32767)
        i++
      };
      this.count = i
    }
  }
  
  /**
 * Class for managing a queue of tasks to be executed at intervals.
 */
export class TaskQueue {
  tasks = [];
  #run;
  runCount;

  /**
   * Starts running the tasks in the queue.
   * @param {number} runCount - The number of tasks to run in each interval.
   */
  run(runCount) {
    this.#run = system.runInterval(() => {
      for (let iter = 0; iter < runCount; iter++) {
        if (this.tasks.length !== 0) {
          this.tasks.shift()(); // Execute the next task
        }
      }
    }, 0);
    this.runCount = runCount;
  }

  /**
   * Stops the execution of the queued tasks.
   */
  stop() {
    system.clearRun(this.#run);
  }

  /**
   * Adds tasks to the queue.
   * @param {...function} args - The functions to be added to the task queue.
   */
  push = (...args) => this.tasks.push(...args);
}