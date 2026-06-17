import { UserProfileUseCase } from './user-profile.use-case';
import { UserNotFoundError } from '../../domain/errors/auth/index';
import type { IUnitOfWork } from 'src/contexts/shared/domain/repositories/unit-of-work.interface';
import type { UserEntity } from 'src/contexts/shared/domain/entities/auth/user.entity';

function makeUser(overrides: Partial<UserEntity> = {}): UserEntity {
  return {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    avatarUrl: null,
    xp: 0,
    level: 1,
    xpLevel: null,
    streakDays: 0,
    lastActiveAt: null,
    planCode: 'free',
    guestDeviceId: null,
    deviceId: 'device-1',
    isVip: false,
    themeMode: 'system',
    learningStyle: null,
    coursePreferences: null,
    learningNotes: null,
    freeTrialUsed: false,
    deletedAt: null,
    ...overrides,
  } as UserEntity;
}

function makeUow(overrides: Partial<IUnitOfWork> = {}): IUnitOfWork {
  return {
    users: {
      findById: jest.fn(),
      update: jest.fn(),
      hardDelete: jest.fn(),
    },
    deviceTrials: {
      markUsed: jest.fn(),
    },
    ...overrides,
  } as unknown as IUnitOfWork;
}

describe('UserProfileUseCase.deleteMe', () => {
  it('hard-deletes guest accounts and marks device trial used', async () => {
    const guest = makeUser({
      email: null,
      guestDeviceId: 'guest-device-1',
      deviceId: 'guest-device-1',
    });
    const users = {
      findById: jest.fn().mockResolvedValue(guest),
      update: jest.fn(),
      hardDelete: jest.fn().mockResolvedValue(undefined),
    };
    const deviceTrials = { markUsed: jest.fn().mockResolvedValue(undefined) };
    const useCase = new UserProfileUseCase(makeUow({ users, deviceTrials } as unknown as Partial<IUnitOfWork>));

    await useCase.deleteMe(guest.id);

    expect(deviceTrials.markUsed).toHaveBeenCalledWith('guest-device-1', guest.id);
    expect(users.hardDelete).toHaveBeenCalledWith(guest.id);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('soft-deletes registered accounts and marks device trial used', async () => {
    const registered = makeUser({ email: 'user@example.com', deviceId: 'device-1' });
    const users = {
      findById: jest.fn().mockResolvedValue(registered),
      update: jest.fn().mockResolvedValue({ ...registered, deletedAt: new Date() }),
      hardDelete: jest.fn(),
    };
    const deviceTrials = { markUsed: jest.fn().mockResolvedValue(undefined) };
    const useCase = new UserProfileUseCase(makeUow({ users, deviceTrials } as unknown as Partial<IUnitOfWork>));

    await useCase.deleteMe(registered.id);

    expect(users.update).toHaveBeenCalledWith(registered.id, { deletedAt: expect.any(Date) });
    expect(users.hardDelete).not.toHaveBeenCalled();
    expect(deviceTrials.markUsed).toHaveBeenCalledWith('device-1', registered.id);
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    const users = {
      findById: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      hardDelete: jest.fn(),
    };
    const useCase = new UserProfileUseCase(makeUow({ users } as unknown as Partial<IUnitOfWork>));

    await expect(useCase.deleteMe('missing')).rejects.toBeInstanceOf(UserNotFoundError);
    expect(users.hardDelete).not.toHaveBeenCalled();
    expect(users.update).not.toHaveBeenCalled();
  });

  it('does not call markUsed when user has no device id', async () => {
    const guest = makeUser({ email: null, guestDeviceId: null, deviceId: null });
    const users = {
      findById: jest.fn().mockResolvedValue(guest),
      update: jest.fn(),
      hardDelete: jest.fn().mockResolvedValue(undefined),
    };
    const deviceTrials = { markUsed: jest.fn() };
    const useCase = new UserProfileUseCase(makeUow({ users, deviceTrials } as unknown as Partial<IUnitOfWork>));

    await useCase.deleteMe(guest.id);

    expect(users.hardDelete).toHaveBeenCalledWith(guest.id);
    expect(deviceTrials.markUsed).not.toHaveBeenCalled();
  });
});
