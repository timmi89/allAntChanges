import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;

import java.util.concurrent.TimeUnit;

/**
 * Abstract base class for our widget tests.
 */
public class AbstractWidgetTests {

    protected static FirefoxDriver driver;

    @BeforeClass
    public static void setupDriver() {
        driver = new FirefoxDriver();
        driver.manage().timeouts().implicitlyWait(3, TimeUnit.SECONDS);
    }

    @AfterClass
    public static void quitDriver() {
        driver.quit();
    }

    /**
     * Attempts to find an element and returns either the element or null.
     */
    public WebElement findByXpath(String xpath) {
        WebElement element = null;
        try {
            element = driver.findElement(By.xpath(xpath));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

    public WebElement findByXpath(String xpath, WebElement parent) {
        WebElement element = null;
        try {
            element = parent.findElement(By.xpath(xpath));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }

    /**
     * Attempts to find an element and returns either the element or null.
     */
    public WebElement findById(String id) {
        WebElement element = null;
        try {
            element = driver.findElement(By.id(id));
        } catch (NoSuchElementException e) {
            // Do nothing!
        }
        return element;
    }
}
