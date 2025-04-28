import Order from '../models/Order.js';
import { OrderStatus } from '../models/OrderStatus.js';

/**
 * Get all transactions with pagination, filtering, and sorting
 */
export const getAllTransactions = async (req, res) => {
  try {
    // Extract query parameters for filtering, pagination and sorting
    const {
      status,
      school_ids,
      start_date,
      end_date,
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_direction = 'desc'
    } = req.query;

    // Prepare the match condition for filtering
    const match = {};
    
    // Filter by status if provided
    if (status && Array.isArray(status) && status.length > 0) {
      // Convert status values to lowercase for case-insensitive matching
      const statusValues = status.map(s => s.toLowerCase());
      match['orderStatus.status'] = { $in: statusValues };
    }
    
    // Filter by school_ids if provided
    if (school_ids && Array.isArray(school_ids) && school_ids.length > 0) {
      match['school_id'] = { $in: school_ids };
    }
    
    // Date range filtering
    if (start_date || end_date) {
      match['orderStatus.payment_time'] = {};
      if (start_date) {
        match['orderStatus.payment_time'].$gte = new Date(start_date);
      }
      if (end_date) {
        match['orderStatus.payment_time'].$lte = new Date(end_date);
      }
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(page_size);
    
    // Determine the sort direction
    const sortValue = sort_direction.toLowerCase() === 'asc' ? 1 : -1;
    
    // Pipeline for MongoDB aggregation
    const pipeline = [
      // Stage 1: Lookup to join Order and OrderStatus
      {
        $lookup: {
          from: 'order_statuses', // Use the correct collection name
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderStatus'
        }
      },
      // Stage 2: Unwind the orderStatus array
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      // Stage 3: Match documents based on filters
      { $match: match },
      // Stage 4: Project only the required fields
      {
        $project: {
          _id: 0,
          collect_id: { $ifNull: ['$orderStatus.collect_id', ''] },
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: { $ifNull: ['$orderStatus.order_amount', '$amount'] },
          transaction_amount: { $ifNull: ['$orderStatus.transaction_amount', '$amount'] },
          status: { 
            $cond: {
              if: { $eq: [{ $ifNull: ['$orderStatus.status', null] }, null] },
              then: { $ifNull: ['$status', 'pending'] },
              else: {
                $switch: {
                  branches: [
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'success'] }, then: 'Success' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'pending'] }, then: 'Pending' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'failed'] }, then: 'Failed' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'cancelled'] }, then: 'Cancelled' }
                  ],
                  default: { $ifNull: [{ $toUpper: { $substr: ['$orderStatus.status', 0, 1] } }, ''] }
                }
              }
            }
          },
          custom_order_id: { $toString: '$_id' },
          created_at: { $ifNull: ['$orderStatus.payment_time', '$createdAt'] }
        }
      },
      // Stage 5: Sort the results
      { $sort: { [sort_by]: sortValue } },
      // Stage 6: Skip for pagination
      { $skip: skip },
      // Stage 7: Limit the results
      { $limit: parseInt(page_size) }
    ];

    // Execute the aggregation pipeline
    const transactions = await Order.aggregate(pipeline);

    // Count total documents for pagination info
    const countPipeline = [
      { $lookup: { from: 'order_statuses', localField: '_id', foreignField: 'order_id', as: 'orderStatus' } },
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      { $match: match },
      { $count: 'total' }
    ];
    const totalCount = await Order.aggregate(countPipeline);
    const total = totalCount.length > 0 ? totalCount[0].total : 0;

    // Return the transactions with pagination info
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / parseInt(page_size))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
};

/**
 * Get transactions for a specific school
 */
export const getTransactionsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_direction = 'desc'
    } = req.query;

    // Validate school ID
    if (!schoolId) {
      return res.status(400).json({ error: 'School ID is required' });
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(page_size);
    
    // Determine the sort direction
    const sortValue = sort_direction.toLowerCase() === 'asc' ? 1 : -1;

    // Pipeline for MongoDB aggregation
    const pipeline = [
      // Stage 1: Match documents with the specified school_id
      { $match: { school_id: schoolId } },
      // Stage 2: Lookup to join Order and OrderStatus
      {
        $lookup: {
          from: 'order_statuses',
          localField: '_id',
          foreignField: 'order_id',
          as: 'orderStatus'
        }
      },
      // Stage 3: Unwind the orderStatus array
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      // Stage 4: Project only the required fields
      {
        $project: {
          _id: 0,
          collect_id: { $ifNull: ['$orderStatus.collect_id', ''] },
          school_id: '$school_id',
          gateway: '$gateway_name',
          order_amount: { $ifNull: ['$orderStatus.order_amount', '$amount'] },
          transaction_amount: { $ifNull: ['$orderStatus.transaction_amount', '$amount'] },
          status: { 
            $cond: {
              if: { $eq: [{ $ifNull: ['$orderStatus.status', null] }, null] },
              then: { $ifNull: ['$status', 'pending'] },
              else: {
                $switch: {
                  branches: [
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'success'] }, then: 'Success' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'pending'] }, then: 'Pending' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'failed'] }, then: 'Failed' },
                    { case: { $eq: [{ $toLower: '$orderStatus.status' }, 'cancelled'] }, then: 'Cancelled' }
                  ],
                  default: { $ifNull: [{ $toUpper: { $substr: ['$orderStatus.status', 0, 1] } }, ''] }
                }
              }
            }
          },
          custom_order_id: { $toString: '$_id' },
          created_at: { $ifNull: ['$orderStatus.payment_time', '$createdAt'] }
        }
      },
      // Stage 5: Sort the results
      { $sort: { [sort_by]: sortValue } },
      // Stage 6: Skip for pagination
      { $skip: skip },
      // Stage 7: Limit the results
      { $limit: parseInt(page_size) }
    ];

    // Execute the aggregation pipeline
    const transactions = await Order.aggregate(pipeline);

    // Count total documents for pagination info
    const countPipeline = [
      { $match: { school_id: schoolId } },
      { $lookup: { from: 'order_statuses', localField: '_id', foreignField: 'order_id', as: 'orderStatus' } },
      { $unwind: { path: '$orderStatus', preserveNullAndEmptyArrays: true } },
      { $count: 'total' }
    ];
    const totalCount = await Order.aggregate(countPipeline);
    const total = totalCount.length > 0 ? totalCount[0].total : 0;

    // Return the transactions with pagination info
    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: Math.ceil(total / parseInt(page_size))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions by school:', error);
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
};
