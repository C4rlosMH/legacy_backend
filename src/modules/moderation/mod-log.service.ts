import { ModLogModel } from './mod-log.model';

export const createModLogService = async (data: {
  communityId: string;
  moderatorId: string;
  action: 'ban' | 'unban' | 'hide_profile' | 'strike' | 'delete_post' | 'delete_message' | 'delete_comment' | 'resolve_report';
  targetUserId?: string;
  targetId?: string;
  reason?: string;
}) => {
  return await ModLogModel.create(data);
};

export const getCommunityModLogsService = async (communityId: string, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  
  const logs = await ModLogModel.find({ communityId })
    .populate('moderatorId', 'username avatar globalRole')
    .populate('targetUserId', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await ModLogModel.countDocuments({ communityId });

  return {
    logs,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};