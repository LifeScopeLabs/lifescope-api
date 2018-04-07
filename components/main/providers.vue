<template>
    <main>
        <div class="scroller">
            <div id="provider-grid">
                {% for provider in providers %}
                <div class="mix {% for tag in provider.tags %}{{ tag }} {% endfor %}{% if provider.assoc_count > 0 %}associated{% endif %}" data-id="{{ provider._id | hex }}" data-assoc-count="{{ provider.assoc_count }}">
                    <div>
                        {% if provider.assoc_count > 1 %}
                        <span>{{ provider.assoc_count }}</span>
                        {% endif %}
                        <h1><i class="fa fa-{{ provider.name | lower }}"></i></h1>
                        <p>{{ provider.name }}</p>
                    </div>
                </div>
                {% endfor %}
            </div>
        </div>

        <aside id="connection-modal" class="modal modal-close">
            <div class="container">
                <div class="scroller">
                    <div class="content">
                        <div id="workflow" class="boxed-group" data-provider-id="">
                            <div class="align-center">
                                <div class="flexbox flex-x-center">
                                    <i class=""></i>
                                    <div class="header flex-grow"></div>
                                    <i class="" style="color: transparent;"></i>
                                </div>
                            </div>

                            <div class="padded paragraphed">
                                <form action="/connections" method="POST">
                                    <input type="hidden" name="csrftoken" value="{{ csrf_token }}" />
                                    <input type="hidden" name="provider_id" />

                                    <div class="align-center">
                                        <input class="line-entry align-center" type="text" name="name" placeholder="" style="padding-top: 0;" autofocus />
                                    </div>

                                    <div class="source-container" style="margin-top: 25px;">
                                        <div class="label">What would you like?</div>
                                        <div class="sources"></div>
                                    </div>

                                    <div class="action">
                                        <button class="primary" type="submit">Connect to</button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div id="manage">
                            {% if current_count == 1 %}
                            <a class="primary" href="https://app.lifescope.io/settings/connections?provider={{ provider._id | hex }}">Manage {{ current_count }} {{ provider.name }} Connection</a>
                            {% elif current_count > 1 %}
                            <a class="primary" href="https://app.lifescope.io/settings/connections?provider={{ provider._id | hex }}">Manage {{ current_count }} {{ provider.name }} Connections</a>
                            {% endif %}
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <aside id="login-modal" class="modal modal-close">
            <div class="container">
                <div class="scroller">
                    <div class="content">
                        <i class="modal-close close-button"></i>

                        <div class="body">
                            <div class="paragraph" style="margin-bottom: 15px;">
                                <h3>How do I sign up or log in?</h3>
                                <p>LifeScope demonstrates the power and flexibility of the <a href="https://bitscoop.com" target="_blank">BitScoop platform</a> by allowing you to sign up or log in using any of the services from which you can retrieve data.</p>
                                <p>Just click on any service, Connect to it, and authorize LifeScope to access the data it requests.</p>
                                <p>This Connection is used for both logging you in and retrieving data, hence why it may ask for permissions that don't seem relevant for just login.</p>

                                <h3>Why do I need to re-authorize permissions when logging in?</h3>
                                <p>If you're logged out, we make a new Connection to that service since we don't know whether one already exists.</p>
                                <p>The new Connection is automatically deleted once we can determine that you already had a Connection.</p>
                                <p>Any permissions you may or may not grant on that discarded Connection are not carried over to the existing one.</p>

                                <h3>Why don't all my Connections appear in the same account?</h3>
                                <p>In order to associate multiple Connections with the same LifeScope account, you must be logged in and then Connect from the /providers page.</p>
                                <p>If you sign up using one service, log out, then sign up using a different service, we will have ended up creating two separate LifeScope accounts for you.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </main>
</template>