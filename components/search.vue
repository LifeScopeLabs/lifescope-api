<template slot="search">
	<div id="search-bar" class="input-group">
		<div v-if="!hide_advanced" id="advanced">
			<i class="fa fa-caret-down"></i>
		</div>

		<div v-if="!hide_advanced"  id="filter-controls">
			<div id="filter-editor">
				<div id="filter-buttons">
					<div class="control" data-type="who">
						<i class="fa fa-user"></i>
					</div>

					<div class="control" data-type="what">
						<i class="fa fa-picture-o"></i>
					</div>

					<div class="control" data-type="when">
						<i class="fa fa-calendar"></i>
					</div>

					<div class="control" data-type="connector">
						<i class="fa fa-plug"></i>
					</div>

					<div class="control" data-type="where">
						<i class="fa fa-globe"></i>
					</div>
				</div>

				<div id="filter-values">
					<div id="filter-name" class="hidden">
						<div class="text-box">
							<input type="text" name="name" />
						</div>
					</div>

					<form class="who">
						<div class="input-container">
							<label class="radio active" for="who-type-1"><input id="who-type-1" type="radio" name="interaction" value="" checked /><span>Any</span></label>
							<label class="radio" for="who-type-2"><input id="who-type-2" type="radio" name="interaction" value="to" /><span>To</span></label>
							<label class="radio" for="who-type-3"><input id="who-type-3" type="radio" name="interaction" value="from" /><span>From</span></label>
							<label class="radio" for="who-type-4"><input id="who-type-4" type="radio" name="interaction" value="with" /><span>With</span></label>
						</div>
						<div class="text-box">
							<input type="text" name="contact" placeholder="Contact Name"/>
						</div>
					</form>

					<form class="what">
						<div class="input-container">
							<select name="type">
								<option></option>
								<option value="achievement">Achievement</option>
								<option value="audio">Audio</option>
								<option value="code">Code</option>
								<option value="file">File</option>
								<option value="game">Game</option>
								<option value="image">Image</option>
								<option value="receipt">Receipt</option>
								<option value="software">Software</option>
								<option value="text">Text</option>
								<option value="video">Video</option>
								<option value="web-page">Web Page</option>
							</select>
						</div>
					</form>

					<form class="when">
						<div class="input-container">
							<label class="radio active" for="when-exact"><input id="when-exact" type="radio" name="interaction" value="exact" checked />Exact dates</label>
							<label class="radio" for="when-relative"><input id="when-relative" type="radio" name="interaction" value="relative" />Relative dates</label>
						</div>

						<div class="exact-controls">
							<div>
								From:
							</div>

							<div class="input-group datetimepicker shrink" id="from">
								<input type="text" class="form-control" name="from"/>
								<span class="input-group-addon"><span class="fa fa-calendar"></span></span>
							</div>

							<div>
								To:
							</div>

							<div class="input-group datetimepicker shrink" id="to">
								<input type="text" class="form-control" name="to"/>
								<span class="input-group-addon"><span class="fa fa-calendar"></span></span>
							</div>
						</div>

						<div class="relative-controls hidden">
							<div class="input-container">
								<select name="since-exactly">
									<option value="since">Since</option>
									<option value="exactly">Exactly</option>
								</select>
							</div>

							<div class="text-box">
								<input type="number" name="relative-number" min="1">
							</div>

							<div class="input-container">
								<select name="units">
									<option value="days">Day(s) ago</option>
									<option value="weeks">Week(s) ago</option>
									<option value="months">Month(s) ago</option>
									<option value="years">Year(s) ago</option>
								</select>
							</div>
						</div>

						<div class="estimated">
							<label>
								<input type="checkbox" name="estimated" />
								<span>Return Estimated Results</span>
							</label>
						</div>
					</form>

					<form class="connector">
						<div class="input-container">
							<label class="radio active" for="provider"><input id="provider" type="radio" name="type" value="provider" checked />Connection Type</label>
							<label class="radio" for="connection"><input id="connection" type="radio" name="type" value="connection" />Connection</label>
						</div>

						<div class="provider">
							<div class="input-container">
								<select name="provider">
									<option></option>
								</select>
							</div>
						</div>

						<div class="connection hidden">
							<div class="input-container">
								<select name="connection">
									<option></option>
								</select>
							</div>
						</div>
					</form>

					<form class="where">
						<div>
							Distance:
						</div>

						<div class="text-box">
							<input type="text" name="distance" />
						</div>

						<div>
							Area:
						</div>

						<div class="input-container">
							<label for="where-type-1"><input id="where-type-1" type="radio" name="geometry" value="inside" checked />Inside</label>
							<label for="where-type-2"><input id="where-type-2" type="radio" name="geometry" value="outside" />Outside</label>
						</div>

						<div class="estimated">
							<label>
								<input type="checkbox" name="estimated" />
								<span>Return Estimated Results</span>
							</label>
						</div>
					</form>
				</div>

				<div id="filter-done">
					<button class="primary">Add Filter</button>
				</div>
			</div>

			<div id="filter-list" class="flex-grow"></div>
		</div>

		<form id="query-form" :action="action" method="POST" class="flex-grow">
			<div id="search-box" class="text-box">
				<input id="search-query" type="search" name="search" :placeholder="placeholder" />
			</div>

			<input class="hidden" type="submit" />
		</form>


		<div v-if="!hide_filters" id="filters"></div>
		<div v-if="!hide_filters" id="filter-overflow-count"></div>

		<div v-if="!hide_favorite_star" id="search-favorited">
			<i class="fa"></i>
		</div>

		<div id="search-button">
			<i class="fa fa-search"></i>
		</div>
	</div>
</template>