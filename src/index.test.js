const Sequelize = require('sequelize');

const config = require('statecontainer')({
  sql: {
    connString: 'sqlite://'
  }
});

describe('lab-sql', () => {

  let sqlDb;
  beforeEach(() => {
    sqlDb = require('./index')(config, {
      debug: console.log
    });
  });

  it('should wire together the nothing', () => {
    return sqlDb.wireTogether();
  });

  it('should wire together models', async () => {

    const registerSpy1 = jest.fn(async (getModel) => {
      const model = await getModel('model1');
      model.belongsTo(await getModel('model2'));
      model.belongsTo(await getModel('model3'));

      await model.create({
        firstName: 'a1'
      });

      const projects = await model.findAll();
      expect(projects[0].firstName).toBe('a1');
    });

    const registerSpy2 = jest.fn();
    const registerSpy3 = jest.fn();

    const modelDefinition1 = {
      firstName: Sequelize.STRING,
      lastName: Sequelize.STRING,
      model2Id: Sequelize.INTEGER,
      model3Id: Sequelize.INTEGER,
    };

    const modelDefinition2 = {
      firstName: Sequelize.STRING,
      lastName: Sequelize.STRING
    };

    const modelDefinition3 = {
      firstName: Sequelize.STRING,
      lastName: Sequelize.STRING
    };

    const model1 = await sqlDb.registerModel('model1', modelDefinition1, {}, registerSpy1);
    const model2 = await sqlDb.registerModel('model2', modelDefinition2, {}, registerSpy2);
    const model3 = await sqlDb.registerModel('model3', modelDefinition3, {}, registerSpy3);

    await sqlDb.wireTogether();
    await sqlDb.wireTogether();
    await sqlDb.wireTogether();
    await sqlDb.wireTogether();
    await sqlDb.wireTogether();
    await sqlDb.wireTogether();

    expect(registerSpy1).toHaveBeenCalledTimes(1);
    expect(registerSpy2).toHaveBeenCalledTimes(1);
    expect(registerSpy3).toHaveBeenCalledTimes(1);
  });

});
