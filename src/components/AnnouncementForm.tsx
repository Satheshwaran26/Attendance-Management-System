import React, { useState } from 'react';
import { mockAnnouncementService } from '../services/mockData';
import type { Announcement, User } from '../types';
import { X, Bell, Users, User as UserIcon } from 'lucide-react';

interface AnnouncementFormProps {
  onClose: () => void;
  onCreate: (announcement: Announcement) => void;
  users: User[];
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ onClose, onCreate, users }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        isActive: true,
        targetUserId: targetType === 'specific' && selectedUsers.length === 1 ? selectedUsers[0] : undefined,
        targetUserIds: targetType === 'specific' && selectedUsers.length > 1 ? selectedUsers : undefined,
      };

      const newAnnouncement = await mockAnnouncementService.createAnnouncement(announcementData);
      onCreate(newAnnouncement);
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const isFormValid = title.trim() && message.trim() && 
    (targetType === 'all' || (targetType === 'specific' && selectedUsers.length > 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Create Announcement
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Title *
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter announcement title"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                {title.length}/100 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                id="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter announcement message"
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {message.length}/500 characters
              </p>
            </div>

            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Target Audience
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="targetType"
                    value="all"
                    checked={targetType === 'all'}
                    onChange={(e) => setTargetType(e.target.value as 'all' | 'specific')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">All Users</span>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="targetType"
                    value="specific"
                    checked={targetType === 'specific'}
                    onChange={(e) => setTargetType(e.target.value as 'all' | 'specific')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="ml-3 flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">Specific Users</span>
                  </div>
                </label>
              </div>
            </div>

            {/* User Selection */}
            {targetType === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Users *
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {users.length > 0 ? (
                    <div className="space-y-2">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserToggle(user.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex items-center">
                            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-primary-600 text-xs font-medium">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-700">{user.name}</span>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No users available
                    </div>
                  )}
                </div>
                {targetType === 'specific' && selectedUsers.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Please select at least one user
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {(title || message) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div className="border border-gray-200 rounded-lg p-3 bg-white">
                  {title && (
                    <h5 className="font-medium text-gray-900 mb-2">{title}</h5>
                  )}
                  {message && (
                    <p className="text-sm text-gray-600">{message}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Bell className="h-3 w-3 mr-1" />
                      {targetType === 'all' ? 'All Users' : `${selectedUsers.length} selected user(s)`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Create Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
