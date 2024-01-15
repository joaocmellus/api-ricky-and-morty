const api = {
    characters: axios.create({
        baseURL: 'https://rickandmortyapi.com/api/character',
    }),
    episodes: axios.create({
        baseURL: 'https://rickandmortyapi.com/api/episode',
    }),
    locations: axios.create({
        baseURL: 'https://rickandmortyapi.com/api/location',
    })
};