/**
 * Copyright (c) 2002-2017 "Neo Technology,","
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import neo4j from '../../src/v1';

/**
* The tests below are examples that get pulled into the Driver Manual using the tags inside the tests.
*
* DO NOT add tests to this file that are not for that exact purpose.
* DO NOT modify these tests without ensuring they remain consistent with the equivalent examples in other drivers
*/
describe('examples', () => {

  let driverGlobal;
  let console;
  let originalTimeout;

  let testResultPromise;
  let resolveTestResultPromise;

  beforeAll(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    driverGlobal = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'neo4j'));
  });

  beforeEach(done => {

    testResultPromise = new Promise((resolve, reject) => {
      resolveTestResultPromise = resolve;
    });

    // Override console.log, to assert on stdout output
    console = {log: resolveTestResultPromise};

    const session = driverGlobal.session();
    session.run('MATCH (n) DETACH DELETE n').then(() => {
      session.close(() => {
        done();
      });
    });
  });

  afterAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    driverGlobal.close();
  });

  it('autocommit transaction example', done => {
    const driver = driverGlobal;

    // tag::autocommit-transaction[]
    function addPerson(name) {
      const session = driver.session();
      return session.run('CREATE (a:Person {name: $name})', {name: name}).then(result => {
        session.close();
        return result;
      });
    }

    // end::autocommit-transaction[]

    addPerson('Alice').then(() => {
      const session = driver.session();
      session.run('MATCH (a:Person {name: $name}) RETURN count(a) AS result', {name: 'Alice'}).then(result => {
        session.close(() => {
          expect(result.records[0].get('result').toInt()).toEqual(1);
          done();
        });
      });
    });
  });

  it('basic auth example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::basic-auth[]
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password));
    // end::basic-auth[]

    driver.onCompleted = () => {
      done();
    };

    const session = driver.session();
    session.run('RETURN 1').then(() => {
      session.close();
    });
  });

  it('config max retry time example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::config-max-retry-time[]
    const maxRetryTimeMs = 15 * 1000; // 15 seconds
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password),
      {
        maxTransactionRetryTime: maxRetryTimeMs
      }
    );
    // end::config-max-retry-time[]

    driver.onCompleted = () => {
      done();
    };

    const session = driver.session();
    session.run('RETURN 1').then(() => {
      session.close();
    });
  });

  it('config trust example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::config-trust[]
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password),
      {
        encrypted: 'ENCRYPTION_ON',
        trust: 'TRUST_ALL_CERTIFICATES'
      }
    );
    // end::config-trust[]

    driver.onCompleted = () => {
      done();
    };

    driver.onError = error => {
      console.log(error);
    };

    const session = driver.session();
    session.run('RETURN 1').then(() => {
      session.close();
    }).catch(error => {
    });
  });

  it('config unencrypted example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::config-unencrypted[]
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password),
      {
        encrypted: 'ENCRYPTION_OFF'
      }
    );
    // end::config-unencrypted[]

    driver.onCompleted = () => {
      done();
    };

    const session = driver.session();
    session.run('RETURN 1').then(() => {
      session.close();
    });
  });

  it('custom auth example', () => {
    const principal = 'principal';
    const credentials = 'credentials';
    const realm = 'realm';
    const scheme = 'scheme';
    const parameters = {};

    // tag::custom-auth[]
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.custom(principal, credentials, realm, scheme, parameters)
    );
    // end::custom-auth[]

    expect(driver).toBeDefined();
  });

  it('cypher error example', done => {
    const driver = driverGlobal;
    const personName = 'Bob';

    // tag::cypher-error[]
    const session = driver.session();

    const readTxPromise = session.readTransaction(tx => tx.run('SELECT * FROM Employees WHERE name = $name', {name: personName}));

    readTxPromise.catch(error => {
      session.close();
      console.log(error.message);
    });
    // end::cypher-error[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toBe(
        'Invalid input \'L\': expected \'t/T\' (line 1, column 3 (offset: 2))\n' +
        '"SELECT * FROM Employees WHERE name = $name"\n' +
        '   ^');
      done();
    });
  });

  it('driver lifecycle example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::driver-lifecycle[]
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password));

    driver.onCompleted = metadata => {
      console.log('Driver created');
    };

    driver.onError = error => {
      console.log(error);
    };

    const session = driver.session();
    session.run('CREATE (i:Item)').then(() => {
      session.close();

      // ... on application exit:
      driver.close();
    });
    // end::driver-lifecycle[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toEqual('Driver created');
      done();
    });
  });

  it('hello world example', done => {
    const user = 'neo4j';
    const password = 'neo4j';

    // tag::hello-world[]
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic(user, password));
    const session = driver.session();

    const resultPromise = session.writeTransaction(tx => tx.run(
      'CREATE (a:Greeting) SET a.message = $message RETURN a.message + ", from node " + id(a)',
      {message: 'hello, world'}));

    resultPromise.then(result => {
      session.close();

      const singleRecord = result.records[0];
      const greeting = singleRecord.get(0);

      console.log(greeting);

      // on application exit:
      driver.close();
    });
    // end::hello-world[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg.indexOf('hello, world, from node') === 0).toBeTruthy();
      done();
    });
  });

  it('read write transaction example', done => {
    const driver = driverGlobal;
    const personName = 'Alice';

    // tag::read-write-transaction[]
    const session = driver.session();

    const writeTxPromise = session.writeTransaction(tx => tx.run('CREATE (a:Person {name: $name})', {name: personName}));

    writeTxPromise.then(() => {
      const readTxPromise = session.readTransaction(tx => tx.run('MATCH (a:Person {name: $name}) RETURN id(a)', {name: personName}));

      readTxPromise.then(result => {
        session.close();

        const singleRecord = result.records[0];
        const createdNodeId = singleRecord.get(0);

        console.log('Matched created node with id: ' + createdNodeId);
      });
    });
    // end::read-write-transaction[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg.indexOf('Matched created node with id') === 0).toBeTruthy();
      done();
    });
  });

  it('result consume example', done => {
    const driver = driverGlobal;
    const names = {nameA: 'Alice', nameB: 'Bob'};
    const tmpSession = driver.session();

    tmpSession.run('CREATE (a:Person {name: $nameA}), (b:Person {name: $nameB})', names).then(() => {
      tmpSession.close(() => {

        // tag::result-consume[]
        const session = driver.session();
        const result = session.run('MATCH (a:Person) RETURN a.name ORDER BY a.name');
        const collectedNames = [];

        result.subscribe({
          onNext: record => {
            const name = record.get(0);
            collectedNames.push(name);
          },
          onCompleted: () => {
            session.close();

            console.log('Names: ' + collectedNames.join(', '));
          },
          onError: error => {
            console.log(error);
          }
        });
        // end::result-consume[]
      });
    });

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toEqual('Names: Alice, Bob');
      done();
    });
  });

  it('result retain example', done => {
    const driver = driverGlobal;
    const companyName = 'Acme';
    const personNames = {nameA: 'Alice', nameB: 'Bob'};
    const tmpSession = driver.session();

    tmpSession.run('CREATE (a:Person {name: $nameA}), (b:Person {name: $nameB})', personNames).then(() => {
      tmpSession.close(() => {

        // tag::result-retain[]
        const session = driver.session();

        const readTxPromise = session.readTransaction(tx => tx.run('MATCH (a:Person) RETURN a.name AS name'));

        const addEmployeesPromise = readTxPromise.then(result => {
          const nameRecords = result.records;

          let writeTxsPromise = Promise.resolve();
          for (let i = 0; i < nameRecords.length; i++) {
            const name = nameRecords[i].get('name');

            writeTxsPromise = writeTxsPromise.then(() =>
              session.writeTransaction(tx =>
                tx.run(
                  'MATCH (emp:Person {name: $person_name}) ' +
                  'MERGE (com:Company {name: $company_name}) ' +
                  'MERGE (emp)-[:WORKS_FOR]->(com)',
                  {'person_name': name, 'company_name': companyName})));
          }

          return writeTxsPromise.then(() => nameRecords.length);
        });

        addEmployeesPromise.then(employeesCreated => {
          session.close();
          console.log('Created ' + employeesCreated + ' employees');
        });
        // end::result-retain[]
      });
    });

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toEqual('Created 2 employees');
      done();
    });
  });

  it('service unavailable example', done => {
    const user = 'neo4j';
    const password = 'wrongPassword';

    // tag::service-unavailable[]
    const driver = neo4j.driver('bolt://localhost:7688', neo4j.auth.basic(user, password), {maxTransactionRetryTime: 3000});
    const session = driver.session();

    const writeTxPromise = session.writeTransaction(tx => tx.run('CREATE (a:Item)'));

    writeTxPromise.catch(error => {
      if (error.code === neo4j.error.SERVICE_UNAVAILABLE) {
        console.log('Unable to create node: ' + error.code);
      }
    });
    // end::service-unavailable[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toBe('Unable to create node: ' + neo4j.error.SERVICE_UNAVAILABLE);
      done();
    });
  });

  it('session example', done => {
    const driver = driverGlobal;
    const personName = 'Alice';

    // tag::session[]
    const session = driver.session();

    session.run('CREATE (a:Person {name: $name})', {'name': personName}).then(() => {
      session.close(() => {
        console.log('Person created, session closed');
      });
    });
    // end::session[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toBe('Person created, session closed');
      done();
    });
  });

  it('transaction function example', done => {
    const driver = driverGlobal;
    const personName = 'Alice';

    // tag::transaction-function[]
    const session = driver.session();
    const writeTxPromise = session.writeTransaction(tx => tx.run('CREATE (a:Person {name: $name})', {'name': personName}));

    writeTxPromise.then(result => {
      session.close();

      if (result) {
        console.log('Person created');
      }
    });
    // end::transaction-function[]

    testResultPromise.then(loggedMsg => {
      expect(loggedMsg).toBe('Person created');
      done();
    });
  });
});
