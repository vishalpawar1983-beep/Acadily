import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface TenantConfigProps {
  receiptPrefix: string;
  gstNumber?: string;
  isGstEnabled: boolean;
  features: Record<string, boolean>;
}

export class TenantConfig extends ValueObject<TenantConfigProps> {
  get receiptPrefix(): string {
    return this.props.receiptPrefix;
  }

  get gstNumber(): string | undefined {
    return this.props.gstNumber;
  }

  get isGstEnabled(): boolean {
    return this.props.isGstEnabled;
  }

  get features(): Record<string, boolean> {
    return { ...this.props.features };
  }

  isFeatureEnabled(featureName: string): boolean {
    return this.props.features[featureName] === true;
  }

  static create(props: {
    receiptPrefix: string;
    gstNumber?: string;
    isGstEnabled: boolean;
    features?: Record<string, boolean>;
  }): TenantConfig {
    return new TenantConfig({
      receiptPrefix: props.receiptPrefix,
      gstNumber: props.gstNumber,
      isGstEnabled: props.isGstEnabled,
      features: props.features ?? {},
    });
  }
}
