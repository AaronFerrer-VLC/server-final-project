const axios = require('axios')

const TMDB_API_BASE_URL = process.env.TMDB_API_BASE_URL
const TMDB_API_TOKEN = process.env.TMDB_API_TOKEN

class tmdbServices {

    constructor() {
        this.axiosApp = axios.create({
            baseURL: TMDB_API_BASE_URL
        })

        this.axiosApp.interceptors.request.use(config => {
            config.headers = { Authorization: `Bearer ${TMDB_API_TOKEN}` }
            return config
        })
    }


    fetchPersonDetails(id) {
        return this.axiosApp.get(`person/${id}`)
    }

    fetchMovieDetails(id) {
        return this.axiosApp.get(`movie/${id}?append_to_response=credits`)
    }


    fetchPopularMovies(page = 1, language = 'en-US,', region = 'US') {
        return this.axiosApp.get(`movie/popular`, {
            params: {
                language: language,
                page: page,
                region: region,
            }
        })
    }


    fetchNowPlayingMovies(page = 1, language = 'en-US', region = 'US') {
        return this.axiosApp.get('movie/now_playing', {
            params: {
                language: language,
                page: page,
                region: region,
            },
        });
    }


    fetchTopRatedMovies(page = 1, language = 'en-US', region = 'US') {
        return this.axiosApp.get('movie/top_rated', {
            params: {
                language: language,
                page: page,
                region: region,
            }
        })
    }


    fetchUpcomingMovies(page = 1, language = 'en-US', region = 'US') {
        return this.axiosApp.get('movie/upcoming', {
            params: {
                language: language,
                page: page,
                region: region,
            },
        })
    }
}


module.exports = new tmdbServices()