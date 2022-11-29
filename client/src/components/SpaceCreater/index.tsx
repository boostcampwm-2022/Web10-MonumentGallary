import useSelectorComponent from "../Selector";
import SuspenseButton from "../buttons/SuspenseButton";
import styles from "./style.module.scss";
import { Resource } from "../../utils/suspender";
import { THEME } from "../../@types/gallery";
import themeStore from "../../store/theme.store";
import ProgressBar from "../ProgressBar";
import { useState } from "react";

export type PeriodType = "all" | "2w" | "1m" | "3m" | "1y";

const ModalName = {
  create: "갤러리 만들기",
  sync: "갤러리 동기화하기",
};

const ButtonName = {
  create: "생성하기",
  sync: "동기화하기",
};

interface IOnLoadFunction {
  <T>(a: T): void;
}

interface SpaceCreaterProps {
  eventSourceUrl: string;
  onSubmit: (period: PeriodType | null, theme: THEME | null) => void;
  onLoad: IOnLoadFunction;
  type?: "create" | "sync";
}

export default function SpaceCreater({ eventSourceUrl, onSubmit, onLoad, type = "create" }: SpaceCreaterProps) {
  const [period, PeriodSelectorWrapper, PeriodSelectorItem] = useSelectorComponent<PeriodType>("all");
  const [theme, ThemeSelectorWrapper, ThemeSelectorItem] = useSelectorComponent<THEME>(THEME.DREAM);
  const [requested, setRequested] = useState<boolean>(false);
  return (
    <div className="create-modal">
      <span className="make-gallery">{ModalName[type]}</span>
      <PeriodSelectorWrapper title="기간">
        <PeriodSelectorItem value="all">전체</PeriodSelectorItem>
        <PeriodSelectorItem value="2w">14일</PeriodSelectorItem>
        <PeriodSelectorItem value="1m">1개월</PeriodSelectorItem>
        <PeriodSelectorItem value="3m">3개월</PeriodSelectorItem>
        <PeriodSelectorItem value="1y">1년</PeriodSelectorItem>
      </PeriodSelectorWrapper>
      <ThemeSelectorWrapper title="테마">
        <ThemeSelectorItem value={THEME.DREAM} className={styles.dream}>
          꿈
        </ThemeSelectorItem>
        <ThemeSelectorItem value={THEME.SPRING} className={styles.spring}>
          봄
        </ThemeSelectorItem>
        <ThemeSelectorItem value={THEME.SUMMER} className={styles.summer}>
          여름
        </ThemeSelectorItem>
        <ThemeSelectorItem value={THEME.AUTUMN} className={styles.autumn}>
          가을
        </ThemeSelectorItem>
        <ThemeSelectorItem value={THEME.WINTER} className={styles.winter}>
          겨울
        </ThemeSelectorItem>
      </ThemeSelectorWrapper>
      {requested ? (
        <ProgressBar eventSourceUrl={eventSourceUrl} onLoad={onLoad as IOnLoadFunction} />
      ) : (
        <button
          onClick={() => {
            setRequested(true);
            onSubmit(period, theme);
          }}
        >
          {ButtonName[type]}
        </button>
      )}
    </div>
  );
}
