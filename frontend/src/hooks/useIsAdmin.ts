import { useCurrentAccount, useIotaClientQuery } from '@iota/dapp-kit';
import { useNetworkVariable } from '../networkConfig';

export function useIsAdmin() {
  const currentAccount = useCurrentAccount();
  const globalConfigId = useNetworkVariable('globalConfigId');

  const { data } = useIotaClientQuery(
    'getObject',
    { id: globalConfigId, options: { showContent: true } },
    { enabled: !!globalConfigId && globalConfigId !== '0xTODO' }
  );

  const adminAddress =
    (data as any)?.data?.content?.fields?.admin_address ?? '';
  const isAdmin =
    !!currentAccount?.address &&
    !!adminAddress &&
    currentAccount.address.toLowerCase() === adminAddress.toLowerCase();

  return {
    isAdmin,
    adminAddress,
    currentAddress: currentAccount?.address ?? '',
  };
}
