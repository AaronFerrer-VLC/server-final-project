const mongoose = require('mongoose')

const Review = require('../models/Review.model')
const User = require('../models/User.model')
const tmdbServices = require("./../services/tmdb.services")
const axios = require('axios')

const getReviews = (req, res, next) => {

    Review
        .find()
        .then(reviews => res.json(reviews))
        .catch(err => next(err))
}

const getMostLikedReviews = (req, res, next) => {

    Review
        .find()
        .sort({ likesCounter: -1 })
        .limit(10)
        .then(reviews => res.json(reviews))
        .catch(err => next(err))
}

const getReviewsFromMovie = (req, res, next) => {

    const { movieId: movieApiId } = req.params

    Review
        .find({ movieApiId })
        .sort({ rate: -1 })
        .limit(10)
        .then(reviews => res.json(reviews))
        .catch(err => next(err))
}

const getReviewsFromAuthor = (req, res, next) => {

    const { authorId: author } = req.params

    if (!mongoose.Types.ObjectId.isValid(author)) {
        res.status(404).json({ message: "Id format not valid" });
        return
    }

    Review
        .find({ author })
        .sort({ rate: -1 })
        .limit(10)
        .then(reviews => res.json(reviews))
        .catch(err => next(err))
}


const getOneReview = (req, res, next) => {

    const { id: reviewId } = req.params

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(404).json({ message: "Id format not valid" });
        return
    }

    Review
        .findById(reviewId)
        .then(review => res.json(review))
        .catch(err => next(err))
}

const saveReview = (req, res, next) => {

    const { movieApiId, content, rate } = req.body
    const { _id: author } = req.payload

    Review
        .create({ author, movieApiId, content, rate })
        .then(review => {

            return User.findByIdAndUpdate(
                author,
                { $push: { reviews: review._id } },
                { new: true, runValidators: true }
            )
                .then(() => res.status(201).json(review))
                .catch(err => next(err))
        })
        .catch(err => next(err))
}

const editReview = (req, res, next) => {

    const { movieApiId, content, rate, likesCounter } = req.body
    const { id: reviewId } = req.params

    console.log("Review ID:", reviewId)
    console.log("Request Body:", req.body)

    console.log("Received data:", req.body)

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(404).json({ message: "Id format not valid" });
        return
    }

    Review
        .findByIdAndUpdate(
            reviewId,
            { movieApiId, content, rate, likesCounter },
            { runValidators: true }
        )
        .then(updatedReview => {
            if (!updatedReview) {
                return res.status(404).json({ message: "Review not found" })
            }
            res.status(200).json(updatedReview)
        })
        .catch(err => next(err))
}

const deleteReview = (req, res, next) => {

    const { id: reviewId } = req.params

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(404).json({ message: "Id format not valid" });
        return
    }

    Review
        .findByIdAndDelete(reviewId)
        .then(() => res.sendStatus(200))
        .catch(err => next(err))
}

const filterReviews = (req, res, next) => {

    const { query } = req.query

    if (!query) {
        return res.status(400).json({ message: "Introduce un término de búsqueda" });
    }

    const querySearch = {
        $or: [
            { movieApiId: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } }
        ]
    }

    Review
        .find(querySearch)
        .then(reviews => res.json(reviews))
        .catch(err => next(err))
}

const likeReview = (req, res) => {
    const { id } = req.params

    Review.findById(id,
        { $inc: { likesCounter: 1 } },
        { new: true }
    )
        .then((updatedReview) => {
            if (!updatedReview) {
                return res.status(404).send({ message: "Review not found" });
            }

            res.status(200).json(updatedReview);
        })
        .catch((err) => {
            console.error(err)
            res.status(500).send({ message: "Server error" })
        })
}

const getOneReviewFullData = (req, res, next) => {

    const { id: reviewId } = req.params

    let originalReview

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        res.status(404).json({ message: "Id format not valid" });
        return
    }

    Review
        .findById(reviewId)
        .then(review => {

            originalReview = review

            const { movieApiId, author } = review

            const movieDataPromise = tmdbServices.fetchMovieDetails(movieApiId)

            const authorDataPromise = axios.get(`http://localhost:5005/api/users/${author}`)

            return Promise.all([movieDataPromise, authorDataPromise])
        })

        .then(([movie, author]) => {
            const authorData = author.data
            const movieData = movie.data

            const { _id, content, rate, likesCounter, createdAt } = originalReview

            const newReview = {
                _id,
                content,
                rate,
                likesCounter,
                createdAt,
                author: authorData,
                movieApiId: movieData,
            }

            res.json(newReview)

        })
        .catch(err => next(err))
}

module.exports = {
    getReviews,
    getReviewsFromMovie,
    getReviewsFromAuthor,
    getMostLikedReviews,
    saveReview,
    getOneReview,
    editReview,
    deleteReview,
    filterReviews,
    likeReview,
    getOneReviewFullData
}