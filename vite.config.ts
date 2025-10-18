<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
          <match url="^dist/server.js/debug/[0-9]+$" />
          <action type="None" />
        </rule>
        <rule name="StaticContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="dist/{R:0}" />
        </rule>
        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="dist/server.js" />
        </rule>
      </rules>
    </rewrite>
    <iisnode
      node_env="production"
      nodeProcessCommandLine="&quot;C:\Program Files\nodejs\node.exe&quot;"
      loggingEnabled="false"
      devErrorsEnabled="true" />
  </system.webServer>
</configuration>
