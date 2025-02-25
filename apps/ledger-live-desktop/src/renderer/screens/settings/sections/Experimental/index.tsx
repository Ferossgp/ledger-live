import React, { useEffect, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { isEnvDefault } from "@ledgerhq/live-common/env";
import { experimentalFeatures, isReadOnlyEnv, Feature } from "~/renderer/experimental";
import { useDispatch } from "react-redux";
import { setEnvOnAllThreads } from "~/helpers/env";
import { openModal } from "~/renderer/actions/modals";
import TrackPage from "~/renderer/analytics/TrackPage";
import useEnv from "~/renderer/hooks/useEnv";
import Alert from "~/renderer/components/Alert";
import Button from "~/renderer/components/Button";
import { setShowClearCacheBanner } from "~/renderer/actions/settings";
import { SettingsSectionBody as Body, SettingsSectionRow as Row } from "../../SettingsSection";
import ExperimentalSwitch from "./ExperimentalSwitch";
import ExperimentalInteger from "./ExperimentalInteger";
import ExperimentalFloat from "./ExperimentalFloat";
import FullNode from "~/renderer/screens/settings/sections/Accounts/FullNode";
import LottieTester from "./LottieTester";
import StorylyTester from "./StorylyTester";
import PostOnboardingHubTester from "./PostOnboardingHubTester";
import VaultSigner from "./VaultSigner";

const experimentalTypesMap = {
  toggle: ExperimentalSwitch,
  integer: ExperimentalInteger,
  float: ExperimentalFloat,
};
const ExperimentalFeatureRow = ({
  feature,
  onDirtyChange,
}: {
  feature: Feature;
  onDirtyChange: () => void;
}) => {
  const { dirty, ...rest } = feature;
  const Children = experimentalTypesMap[feature.type];
  const envValue = useEnv(feature.name);
  const isDefault = isEnvDefault(feature.name);
  const onChange = useCallback(
    (name: string, value) => {
      if (dirty) {
        onDirtyChange();
      }
      setEnvOnAllThreads(name, value);
    },
    [dirty, onDirtyChange],
  );
  return Children ? (
    <Row title={feature.title} desc={feature.description}>
      <Children
        value={envValue}
        readOnly={isReadOnlyEnv(feature.name)}
        isDefault={isDefault}
        onChange={onChange}
        {...rest}
      />
    </Row>
  ) : null;
};
const EthereumBridgeRow = () => {
  const dispatch = useDispatch();
  return (
    <Row title="Open Ethereum WebSocket Bridge" desc="open a websocket bridge for web escape hatch">
      <Button
        onClick={() => {
          dispatch(
            openModal("MODAL_WEBSOCKET_BRIDGE", {
              appName: "Ethereum",
            }),
          );
        }}
      >
        Open
      </Button>
    </Row>
  );
};
const SectionExperimental = () => {
  const [needsCleanCache, setNeedsCleanCache] = useState(false);
  const dispatch = useDispatch();
  const onDirtyChange = useCallback(() => setNeedsCleanCache(true), []);
  useEffect(() => {
    return () => {
      if (needsCleanCache) {
        dispatch(setShowClearCacheBanner(true));
      }
    };
  }, [dispatch, needsCleanCache]);
  return (
    <div data-e2e="experimental_section_title">
      <TrackPage category="Settings" name="Experimental" />
      <Body>
        <Alert type="security" m={4}>
          <Trans i18nKey="settings.experimental.disclaimer"></Trans>
        </Alert>
        {experimentalFeatures.map(feature =>
          !feature.shadow || (feature.shadow && !isEnvDefault(feature.name)) ? (
            <ExperimentalFeatureRow
              key={feature.name}
              feature={feature}
              onDirtyChange={onDirtyChange}
            />
          ) : null,
        )}
        {process.env.SHOW_ETHEREUM_BRIDGE ? <EthereumBridgeRow /> : null}
        {process.env.DEBUG_LOTTIE ? <LottieTester /> : null}
        {process.env.DEBUG_STORYLY ? <StorylyTester /> : null}
        {process.env.DEBUG_POSTONBOARDINGHUB ? <PostOnboardingHubTester /> : null}
        <VaultSigner />
        <FullNode />
      </Body>
    </div>
  );
};
export default SectionExperimental;
