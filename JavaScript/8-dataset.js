'use strict';

let flagForAutoCommit = false;
let isAutoCommit = false;
let timeForAutoCommit = 0;

let flagForAutoRollback = false;
let isAutoRollback = false;
let timeForAutoRollback = 0;

let change = false;

function Transaction() {}

Transaction.start = (data) => {
  console.log('\nstart transaction');
  const events = {
    commit: [], rollback: [], timeout: [], change: []
  };
  let delta = {};

  const emit = (name) => {
    const event = events[name];
    for (const listener of event) listener(data);
  };
  
  function auto() {
    if (change) {
      if (isAutoCommit) {
        flagForAutoCommit = true;
        methods.autoCommit(timeForAutoCommit);
      }
      if (isAutoRollback) {
        flagForAutoRollback = true;
        methods.autoRollback(timeForAutoRollback);
      }
      change = false;
    }
  }

  const methods = {
    commit: () => {
      Object.assign(data, delta);
      delta = {};
      emit('commit');
    },
    rollback: () => {
      delta = {};
      emit('rollback');
    },
    clone: () => {
      const cloned = Transaction.start(data);
      Object.assign(cloned.delta, delta);
      return cloned;
    },
    on: (name, callback) => {
      const event = events[name];
      if (event) event.push(callback);
    }
    timeout: (msec) => {
      setTimeout(() => {
        delta = {};
        console.log('Rollback');
      }, msec);
    },
    autoCommit: (msec) => {
      isAutoCommit = true;
      timeForAutoCommit = msec;
      if (flagForAutoCommit) {
        setTimeout(() => {
          Object.assign(data, delta);
          delta = {};
          console.log('AutoCommit');
        }, msec);
        flagForAutoCommit = false;
      }
    },
    autoRollback: (msec) => {
      isAutoRollback = true;
      timeForAutoRollback = msec;
      if (flagForAutoRollback) {
        setTimeout(() => {
          delta = {};
          console.log('AutoRollback');
        }, msec);
        flagForAutoRollback = false;
      }
    },
    clearTimeout: () => {
      isAutoCommit = false;
      isAutoRollback = false;
      console.log('Timeouts are turned off');
    }
  };

  return new Proxy(data, {
    get(target, key) {
      if (key === 'delta') return delta;
      if (methods.hasOwnProperty(key)) return methods[key];
      if (delta.hasOwnProperty(key)) return delta[key];
      return target[key];
    },
    getOwnPropertyDescriptor: (target, key) => (
      Object.getOwnPropertyDescriptor(
        delta.hasOwnProperty(key) ? delta : target, key
      )
    ),
    ownKeys() {
      const changes = Object.keys(delta);
      const keys = Object.keys(data).concat(changes);
      return keys.filter((x, i, a) => a.indexOf(x) === i);
    },
    set(target, key, val) {
      change = true;
      console.log('set', key, val);
      if (target[key] === val) delete delta[key];
      else delta[key] = val;
      auto();
      return true;
    }
  });
};

function DatasetTransaction(dataset) {
  this.dataset = dataset;
  this.log = []; // array of LogRecord { time, operation, delta }
  // [
  //    { id, time: '2018-01-01T12:01:00', operation: 'start' }
  //    { id, time: '2018-01-01T12:02:15', operation: 'set', delta }
  //    { id, time: '2018-01-01T12:02:32', operation: 'commit', delta }
  //    { id, time: '2018-01-01T12:02:37', operation: 'set', delta }
  //    { id, time: '2018-01-01T12:03:11', operation: 'rollback', delta }
  //    { id, time: '2018-01-01T12:03:18', operation: 'set', delta }
  //    { id, time: '2018-01-01T12:04:42', operation: 'timeout' }
  //    { id, time: '2018-01-01T12:04:52', operation: 'rollback', delta }
  // ]
}

DatasetTransaction.start = function(dataset) {
  // place implementation here
  return new DatasetTransaction(dataset);
};

DatasetTransaction.prototype.commit = function() {
  // place implementation here
};

DatasetTransaction.prototype.rollback = function(id /* optional log id */) {
  // place implementation here
};

DatasetTransaction.prototype.timeout = function(
  msec, // timeout, 0 - disable
  commit, // true - commit, false - rollback
  listener // (optional) function(boolean) : boolean
) {
  // place implementation here
};

// Usage

const data = [
  { name: 'Marcus Aurelius', born: 121 },
  { name: 'Marcus Aurelius', born: 121 },
  { name: 'Marcus Aurelius', born: 121 },
];

const transaction = DatasetTransaction.start(data);

for (const person of transaction.dataset) {
  person.city = 'Shaoshan';
}

transaction.commit();

console.dir({ data });
