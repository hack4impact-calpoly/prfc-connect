/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import { prismaMock } from '../mocks/prisma';
import { AppError } from '@/utils/errors';
import * as ContactGroupService from '../../src/services/contact-group';

describe('Contact Group Service', () => {

  describe('getGroupsByOwner()', () => {
    it('returns groups with member count', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', ownerid: 100, _count: { members: 5 } }
      ];
      prismaMock.contactGroup.findMany.mockResolvedValue(mockGroups as any);

      const result = await ContactGroupService.getGroupsByOwner(100);

      expect(prismaMock.contactGroup.findMany).toHaveBeenCalledWith({
        where: { ownerid: 100 },
        include: { _count: { select: { members: true } } },
        orderBy: { createdAt: "desc" },
      });
      expect(result[0].memberCount).toBe(5);
    });

    it('transforms Prisma errors correctly', async () => {
      prismaMock.contactGroup.findMany.mockRejectedValue(new Error('Database down'));
      await expect(ContactGroupService.getGroupsByOwner(100)).rejects.toThrow();
    });
  });

  describe('getAllGroups()', () => {
    it('admin view, returns all groups', async () => {
      const mockGroups = [{ id: 1, _count: { members: 2 } }];
      prismaMock.contactGroup.findMany.mockResolvedValue(mockGroups as any);

      const result = await ContactGroupService.getAllGroups();

      expect(prismaMock.contactGroup.findMany).toHaveBeenCalledWith(expect.not.objectContaining({ where: expect.anything() }));
      expect(result[0].memberCount).toBe(2);
    });
  });

  describe('getGroupById()', () => {
    it('found case: returns group with members and count', async () => {
      const mockGroup = { id: 1, members: [], _count: { members: 0 } };
      prismaMock.contactGroup.findUnique.mockResolvedValue(mockGroup as any);

      const result = await ContactGroupService.getGroupById(1);

      expect(result.id).toBe(1);
      expect(result.memberCount).toBe(0);
    });

    it('not found case: throws NOT_FOUND AppError', async () => {
      prismaMock.contactGroup.findUnique.mockResolvedValue(null);

      await expect(ContactGroupService.getGroupById(999)).rejects.toThrowError(AppError);
      await expect(ContactGroupService.getGroupById(999)).rejects.toThrow('Group with id 999 not found');
    });
  });

  describe('isGroupOwner()', () => {
    it('returns true if group exists for owner', async () => {
      prismaMock.contactGroup.findFirst.mockResolvedValue({ id: 1 } as any);
      const result = await ContactGroupService.isGroupOwner(1, 100);
      expect(result).toBe(true);
    });

    it('returns false if group does not exist for owner', async () => {
      prismaMock.contactGroup.findFirst.mockResolvedValue(null);
      const result = await ContactGroupService.isGroupOwner(1, 100);
      expect(result).toBe(false);
    });
  });

  describe('createGroup()', () => {
    it('validates owner assignment during creation', async () => {
      const mockData = { name: 'New Group', description: 'Test' };
      prismaMock.contactGroup.create.mockResolvedValue({ id: 1, ...mockData, ownerid: 100 } as any);

      const result = await ContactGroupService.createGroup(mockData, 100);

      expect(prismaMock.contactGroup.create).toHaveBeenCalledWith({
        data: { name: 'New Group', description: 'Test', ownerid: 100 },
      });
      expect(result.ownerid).toBe(100);
    });
  });

  describe('updateGroup()', () => {
    it('partial updates work', async () => {
      const updateData = { name: 'Updated Name' };
      prismaMock.contactGroup.update.mockResolvedValue({ id: 1, name: 'Updated Name' } as any);

      await ContactGroupService.updateGroup(1, updateData);

      expect(prismaMock.contactGroup.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('deleteGroup()', () => {
    it('calls delete on the group (cascade delete handled by DB)', async () => {
      prismaMock.contactGroup.delete.mockResolvedValue({ id: 1 } as any);
      await ContactGroupService.deleteGroup(1);
      expect(prismaMock.contactGroup.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('addMemberToGroup()', () => {
    it('adds a single member with notification preferences', async () => {
      prismaMock.contactGroupMember.create.mockResolvedValue({ groupId: 1, memberId: 2 } as any);
      
      await ContactGroupService.addMemberToGroup(1, 2, 100, { notifyEmail: true, notifySms: false });

      expect(prismaMock.contactGroupMember.create).toHaveBeenCalledWith({
        data: { groupId: 1, memberId: 2, addedBy: 100, notifyEmail: true, notifySms: false },
      });
    });
  });

  describe('addMembersToGroup()', () => {
    it('bulk adds members and skips duplicates', async () => {
      prismaMock.contactGroupMember.createMany.mockResolvedValue({ count: 2 });
      
      const members = [
        { memberId: 2, notifyEmail: true, notifySms: false },
        { memberId: 3, notifyEmail: false, notifySms: true }
      ];

      const result = await ContactGroupService.addMembersToGroup(1, members, 100);

      expect(prismaMock.contactGroupMember.createMany).toHaveBeenCalledWith({
        data: expect.any(Array),
        skipDuplicates: true, // Specifically tests the acceptance criteria
      });
      expect(result.count).toBe(2);
    });
  });

  describe('removeMemberFromGroup()', () => {
    it('removes a specific member', async () => {
      prismaMock.contactGroupMember.delete.mockResolvedValue({} as any);
      await ContactGroupService.removeMemberFromGroup(1, 2);
      expect(prismaMock.contactGroupMember.delete).toHaveBeenCalledWith({
        where: { groupId_memberId: { groupId: 1, memberId: 2 } },
      });
    });
  });

  describe('updateMemberNotifications()', () => {
    it('toggles email/SMS preferences', async () => {
      const prefs = { notifyEmail: false, notifySms: true };
      prismaMock.contactGroupMember.update.mockResolvedValue({} as any);
      
      await ContactGroupService.updateMemberNotifications(1, 2, prefs);

      expect(prismaMock.contactGroupMember.update).toHaveBeenCalledWith({
        where: { groupId_memberId: { groupId: 1, memberId: 2 } },
        data: prefs,
      });
    });
  });

  describe('getGroupRecipients()', () => {
    it('filters by email channel', async () => {
      prismaMock.contactGroupMember.findMany.mockResolvedValue([{ memberId: 5 }, { memberId: 6 }] as any);
      
      const result = await ContactGroupService.getGroupRecipients(1, 'email');

      expect(prismaMock.contactGroupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 1, notifyEmail: true },
        select: { memberId: true },
      });
      expect(result).toEqual([5, 6]);
    });

    it('filters by sms channel', async () => {
      prismaMock.contactGroupMember.findMany.mockResolvedValue([{ memberId: 9 }] as any);
      
      const result = await ContactGroupService.getGroupRecipients(1, 'sms');

      expect(prismaMock.contactGroupMember.findMany).toHaveBeenCalledWith({
        where: { groupId: 1, notifySms: true },
        select: { memberId: true },
      });
      expect(result).toEqual([9]);
    });
  });

});