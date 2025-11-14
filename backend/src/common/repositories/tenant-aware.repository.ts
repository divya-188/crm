import { Repository, FindOptionsWhere, FindManyOptions, FindOneOptions } from 'typeorm';

export abstract class TenantAwareRepository<T extends { tenantId?: string }> {
  constructor(protected repository: Repository<T>) {}

  protected addTenantFilter(tenantId: string, where?: FindOptionsWhere<T>): FindOptionsWhere<T> {
    return {
      ...where,
      tenantId,
    } as FindOptionsWhere<T>;
  }

  async findByTenant(tenantId: string, options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.addTenantFilter(tenantId, options?.where as FindOptionsWhere<T>),
    });
  }

  async findOneByTenant(tenantId: string, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: this.addTenantFilter(tenantId, options?.where as FindOptionsWhere<T>),
    });
  }

  async createForTenant(tenantId: string, data: Partial<T>): Promise<T> {
    const entity = this.repository.create({
      ...data,
      tenantId,
    } as any);
    const saved = await this.repository.save(entity as any);
    return saved as T;
  }

  async updateForTenant(tenantId: string, id: string, data: Partial<T>): Promise<void> {
    await this.repository.update(
      { id, tenantId } as any,
      data as any,
    );
  }

  async deleteForTenant(tenantId: string, id: string): Promise<void> {
    await this.repository.delete({ id, tenantId } as any);
  }
}
