import { Injectable } from '@nestjs/common'

import { ProcessDescriptor } from 'ps-list'

@Injectable()
export class ProcessService {
  constructor() {}
  public async getPsList(): Promise<ProcessDescriptor[]> {
    const psList = await import('ps-list')
    const processes = await psList.default()

    return processes
  }
}
