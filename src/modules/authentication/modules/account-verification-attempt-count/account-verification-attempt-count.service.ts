import { Injectable } from '@nestjs/common';
import { AccountVerificationAttemptCountRepository } from './account-verification-attempt-count.repository';

@Injectable()
export class AccountVerificationAttemptCountService {
  constructor(private readonly accountVerificationAttemptCountRepository: AccountVerificationAttemptCountRepository) {}
}
