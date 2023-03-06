import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { NftCard, NftCardDisplayProps } from 'nft/components/card'
import { VerifiedIcon } from 'nft/components/icons'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { ethNumberStandardFormatter, floorFormatter } from 'nft/utils'
import { useMemo } from 'react'

interface ViewMyNftsAssetProps {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  hideDetails: boolean
}

export const ViewMyNftsAsset = ({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  hideDetails,
}: ViewMyNftsAssetProps) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

  const trace = useTrace()
  const onCardClick = () => handleSelect(isSelected)

  const handleSelect = (removeAsset: boolean) => {
    if (removeAsset) {
      removeSellAsset(asset)
    } else {
      selectSellAsset(asset)
      sendAnalyticsEvent(NFTEventName.NFT_SELL_ITEM_ADDED, {
        collection_address: asset.asset_contract.address,
        token_id: asset.tokenId,
        ...trace,
      })
    }
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  const isDisabled = asset.asset_contract.tokenType === NftStandard.Erc1155 || asset.susFlag
  const shouldShowUserListedPrice = !asset.notForSale && asset.asset_contract.tokenType !== NftStandard.Erc1155

  const display: NftCardDisplayProps = useMemo(() => {
    return {
      primaryInfo: !!asset.asset_contract.name && asset.asset_contract.name,
      primaryInfoExtra: asset.collectionIsVerified && <VerifiedIcon height="16px" width="16px" />,
      secondaryInfo: asset.name || asset.tokenId ? asset.name ?? `#${asset.tokenId}` : null,
      tertiaryInfo:
        shouldShowUserListedPrice && asset.floor_sell_order_price
          ? `${floorFormatter(asset.floor_sell_order_price)} ETH`
          : asset.lastPrice
          ? `Last sale: ${ethNumberStandardFormatter(asset.lastPrice)} ETH`
          : null,
      selectedInfo: 'Remove from bag',
      notSelectedInfo: 'List for sale',
    }
  }, [
    asset.asset_contract.name,
    asset.collectionIsVerified,
    asset.floor_sell_order_price,
    asset.lastPrice,
    asset.name,
    asset.tokenId,
    shouldShowUserListedPrice,
  ])

  return (
    <NftCard
      asset={asset}
      display={display}
      isSelected={isSelected}
      isDisabled={Boolean(isDisabled)}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
      onClick={onCardClick}
      mediaShouldBePlaying={mediaShouldBePlaying}
      setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
      testId="nft-profile-asset"
      doNotLinkToDetails={hideDetails}
    />
  )
}
