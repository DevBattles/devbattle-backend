import { AppError } from '../utils/AppError.js';

/**
 * Middleware to parse and validate pagination parameters
 * Expects query params: page, limit
 * Sets req.pagination with { skip, take, page, limit }
 */
export const parsePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('Page number must be greater than 0', 400);
    }
    if (limit < 1 || limit > 100) {
      throw new AppError('Limit must be between 1 and 100', 400);
    }

    req.pagination = { skip, take: limit, page, limit };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to parse and validate sorting parameters
 * Expects query params: sortBy, sortOrder
 * Sets req.sorting with { sortBy, sortOrder }
 */
export const parseSorting = (req, res, next) => {
  try {
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Validate sort order
    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new AppError('Sort order must be either "asc" or "desc"', 400);
    }

    req.sorting = { sortBy, sortOrder };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to parse filter parameters
 * Expects query params to be used as filters
 * Sets req.filters with parsed filter object
 */
export const parseFilters = (req, res, next) => {
  try {
    const filters = {};
    
    // Common filter parameters
    const filterParams = ['status', 'difficulty', 'category', 'role', 'isPublished', 'visibility'];
    
    filterParams.forEach(param => {
      if (req.query[param] !== undefined) {
        filters[param] = req.query[param];
      }
    });

    // Handle date range filters
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate);
    }

    req.filters = filters;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to parse search parameters
 * Expects query params: search, searchFields
 * Sets req.search with { query, fields }
 */
export const parseSearch = (req, res, next) => {
  try {
    const searchQuery = req.query.search;
    const searchFields = req.query.searchFields ? req.query.searchFields.split(',') : ['title', 'description'];

    if (searchQuery) {
      req.search = {
        query: searchQuery,
        fields: searchFields
      };
    } else {
      req.search = null;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Combined middleware for all query operations
 */
export const parseQuery = [parsePagination, parseSorting, parseFilters, parseSearch];
