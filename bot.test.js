const getRandomDeadPlayerName = require('./bot')

test('test', () => {
    const players = [{
        name: 'john',
        deathRecap: false
    },{
        name: 'john dead',
        deathRecap: true
    }]
    const actualName = getRandomDeadPlayerName(players)
    const expectedName = 'john dead'
    expect(actualName).toEqual(expectedName)
})
