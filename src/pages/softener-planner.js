import AquaSoftenerPlannerComponent from "@/pageComponents/softenerPlanning";
import { createManagedSeoStaticProps } from "@/services/seo";

const AquaSoftenerPlanner = () => <AquaSoftenerPlannerComponent />;

export const getStaticProps = createManagedSeoStaticProps("softener-planner");

export default AquaSoftenerPlanner;
