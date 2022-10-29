const getRandomDeadPlayerName = require('./bot')

test('test', () => {
    const players = [{
        name: 'john',
        deathRecap: false
    },{
        name: 'john dead',
        deathRecap: true
    }]
    expect(getRandomDeadPlayerName(players)).toEqual('john dead')
})
