import { Composition, Still } from "remotion";
import { MainComp } from "./MainComp";
import { Promo1, Promo2, Promo3, Promo4 } from "./PromoStill";

export const Root = () => {
    return (
        <>
            <Composition
                id="MainComp"
                component={MainComp}
                durationInFrames={360}
                fps={30}
                width={1920}
                height={1080}
            />
            <Still id="Promo1" component={Promo1} width={1200} height={675} />
            <Still id="Promo2" component={Promo2} width={1200} height={675} />
            <Still id="Promo3" component={Promo3} width={1200} height={675} />
            <Still id="Promo4" component={Promo4} width={1200} height={675} />
        </>
    );
};
