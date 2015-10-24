import org.junit.runner.RunWith;
import org.junit.runners.Suite;

@RunWith(Suite.class)
@Suite.SuiteClasses({
    SimpleTests.class,
    DynamicContentTests.class,
    NestedTextTests.class
})
public class AllWidgetTests {

}
